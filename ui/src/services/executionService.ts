/**
 * Execution Service for ComfyUI-Distributed
 *
 * Handles queue prompt interception and distributed execution coordination
 * Port of the legacy executionUtils.js functionality to React/TypeScript
 */
import { createApiClient } from './apiClient'

interface DistributedNode {
  id: string
  class_type: string
}

interface WorkflowData {
  workflow: any
  output: any
}

interface JobExecution {
  type: 'master' | 'worker'
  worker?: any
  prompt?: any
  promptWrapper?: WorkflowData
  workflow?: any
  imageReferences?: Map<string, any>
}

interface ExecutionOptions {
  enabled_worker_ids: string[]
  workflow: any
  job_id_map: Map<string, string>
}

export class ExecutionService {
  private static instance: ExecutionService
  private apiClient: ReturnType<typeof createApiClient>
  private originalQueuePrompt: any = null
  private isEnabled: boolean = false
  private imageCache: Map<string, any> = new Map()

  private constructor() {
    this.apiClient = createApiClient(window.location.origin)
  }

  public static getInstance(): ExecutionService {
    if (!ExecutionService.instance) {
      ExecutionService.instance = new ExecutionService()
    }
    return ExecutionService.instance
  }

  /**
   * Initialize the execution service and set up queue prompt interception
   */
  public initialize() {
    this.setupInterceptor()
    this.isEnabled = true
    console.log('Distributed execution service initialized')
  }

  /**
   * Enable/disable distributed execution
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  /**
   * Set up the queue prompt interceptor
   */
  private setupInterceptor() {
    // Access ComfyUI's API object
    const comfyAPI = (window as any).app?.api
    if (!comfyAPI) {
      console.error(
        'ComfyUI API not available - cannot set up execution interceptor'
      )
      return
    }

    // Store original queuePrompt method
    if (!this.originalQueuePrompt) {
      this.originalQueuePrompt = comfyAPI.queuePrompt.bind(comfyAPI)
    }

    // Replace with our interceptor
    comfyAPI.queuePrompt = async (number: number, prompt: WorkflowData) => {
      if (this.isEnabled) {
        const hasCollector =
          this.findNodesByClass(prompt.output, 'DistributedCollector').length >
          0
        const hasDistUpscale =
          this.findNodesByClass(prompt.output, 'UltimateSDUpscaleDistributed')
            .length > 0

        if (hasCollector || hasDistUpscale) {
          console.log(
            'Distributed nodes detected - executing parallel distributed workflow'
          )
          const result = await this.executeParallelDistributed(prompt)
          return result
        }
      }

      // Fall back to original implementation
      return this.originalQueuePrompt(number, prompt)
    }

    console.log('Queue prompt interceptor set up successfully')
  }

  /**
   * Find nodes by class type in the workflow
   */
  private findNodesByClass(
    apiPrompt: any,
    className: string
  ): DistributedNode[] {
    const nodes: DistributedNode[] = []

    for (const [nodeId, nodeData] of Object.entries(apiPrompt)) {
      const node = nodeData as any
      if (node.class_type === className) {
        nodes.push({ id: nodeId, class_type: className })
      }
    }

    return nodes
  }

  /**
   * Execute distributed workflow across workers
   */
  private async executeParallelDistributed(
    promptWrapper: WorkflowData
  ): Promise<any> {
    try {
      const executionPrefix = 'exec_' + Date.now()

      // Get enabled workers from API
      const config = await this.apiClient.getConfig()
      const enabledWorkers = config.workers
        ? Object.values(config.workers).filter((w: any) => w.enabled)
        : []

      // Pre-flight health check
      const activeWorkers = await this.performPreflightCheck(enabledWorkers)

      if (activeWorkers.length === 0 && enabledWorkers.length > 0) {
        console.log('No active workers found. All enabled workers are offline.')
        // TODO: Show toast notification
        // Fall back to master-only execution
        return this.originalQueuePrompt(0, promptWrapper)
      }

      console.log(
        `Pre-flight check: ${activeWorkers.length} of ${enabledWorkers.length} workers are active`
      )

      // Find all distributed nodes
      const collectorNodes = this.findNodesByClass(
        promptWrapper.output,
        'DistributedCollector'
      )
      const upscaleNodes = this.findNodesByClass(
        promptWrapper.output,
        'UltimateSDUpscaleDistributed'
      )
      const allDistributedNodes = [...collectorNodes, ...upscaleNodes]

      // Map original node IDs to unique job IDs
      const job_id_map = new Map(
        allDistributedNodes.map((node) => [
          node.id,
          `${executionPrefix}_${node.id}`
        ])
      )

      // Prepare distributed jobs
      const preparePromises = Array.from(job_id_map.values()).map((uniqueId) =>
        this.prepareDistributedJob(uniqueId)
      )
      await Promise.all(preparePromises)

      // Prepare jobs for all participants
      const jobs: JobExecution[] = []
      const participants = ['master', ...activeWorkers.map((w: any) => w.id)]

      for (const participantId of participants) {
        const options: ExecutionOptions = {
          enabled_worker_ids: activeWorkers.map((w: any) => w.id),
          workflow: promptWrapper.workflow,
          job_id_map: job_id_map
        }

        const jobApiPrompt = await this.prepareApiPromptForParticipant(
          promptWrapper.output,
          participantId,
          options
        )

        if (participantId === 'master') {
          jobs.push({
            type: 'master',
            promptWrapper: { ...promptWrapper, output: jobApiPrompt }
          })
        } else {
          const worker = activeWorkers.find((w: any) => w.id === participantId)
          if (worker) {
            jobs.push({
              type: 'worker',
              worker,
              prompt: jobApiPrompt,
              workflow: promptWrapper.workflow
            })
          }
        }
      }

      const result = await this.executeJobs(jobs)
      return result
    } catch (error) {
      console.error('Parallel execution failed:', error)
      throw error
    }
  }

  /**
   * Prepare API prompt for a specific participant (master or worker)
   */
  private async prepareApiPromptForParticipant(
    baseApiPrompt: any,
    participantId: string,
    options: ExecutionOptions
  ): Promise<any> {
    const jobApiPrompt = JSON.parse(JSON.stringify(baseApiPrompt))
    const isMaster = participantId === 'master'

    // Find all distributed nodes
    const collectorNodes = this.findNodesByClass(
      jobApiPrompt,
      'DistributedCollector'
    )
    const upscaleNodes = this.findNodesByClass(
      jobApiPrompt,
      'UltimateSDUpscaleDistributed'
    )

    // Handle Distributed collector nodes
    for (const collector of collectorNodes) {
      const inputs = jobApiPrompt[collector.id].inputs

      // Get the unique job ID from the map
      const uniqueJobId = options.job_id_map.get(collector.id) || collector.id

      inputs.multi_job_id = uniqueJobId
      inputs.is_worker = !isMaster

      if (isMaster) {
        inputs.enabled_worker_ids = JSON.stringify(options.enabled_worker_ids)
      } else {
        inputs.master_url = window.location.origin
        inputs.worker_job_id = `${uniqueJobId}_worker_${participantId}`
        inputs.worker_id = participantId
      }
    }

    // Handle Ultimate SD Upscale Distributed nodes
    for (const upscaleNode of upscaleNodes) {
      const inputs = jobApiPrompt[upscaleNode.id].inputs

      const uniqueJobId =
        options.job_id_map.get(upscaleNode.id) || upscaleNode.id

      inputs.multi_job_id = uniqueJobId
      inputs.is_worker = !isMaster

      if (isMaster) {
        inputs.enabled_worker_ids = JSON.stringify(options.enabled_worker_ids)
      } else {
        inputs.master_url = window.location.origin
        inputs.worker_id = participantId
        inputs.enabled_worker_ids = JSON.stringify(options.enabled_worker_ids)
      }
    }

    return jobApiPrompt
  }

  /**
   * Prepare a distributed job on the backend
   */
  private async prepareDistributedJob(multi_job_id: string): Promise<void> {
    try {
      await fetch('/distributed/prepare_job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multi_job_id })
      })
    } catch (error) {
      console.error('Error preparing job:', error)
      throw error
    }
  }

  /**
   * Execute all jobs (master and workers) in parallel
   */
  private async executeJobs(jobs: JobExecution[]): Promise<any> {
    let masterPromptId = null

    const promises = jobs.map((job) => {
      if (job.type === 'master') {
        return this.originalQueuePrompt(0, job.promptWrapper).then(
          (result: any) => {
            masterPromptId = result
            return result
          }
        )
      } else {
        return this.dispatchToWorker(job.worker, job.prompt, job.workflow)
      }
    })

    await Promise.all(promises)

    return masterPromptId || { prompt_id: 'distributed-job-dispatched' }
  }

  /**
   * Dispatch job to a specific worker
   */
  private async dispatchToWorker(
    worker: any,
    prompt: any,
    workflow: any
  ): Promise<void> {
    const workerUrl =
      worker.connection || `http://${worker.host}:${worker.port}`

    console.log(`Dispatching to ${worker.name} (${worker.id}) at ${workerUrl}`)

    const promptToSend = {
      prompt,
      extra_data: { extra_pnginfo: { workflow } },
      client_id: (window as any).app?.api?.clientId || 'distributed-client'
    }

    try {
      await fetch(`${workerUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(promptToSend)
      })

      console.log(`Successfully dispatched job to worker ${worker.name}`)
    } catch (error) {
      console.error(
        `Failed to connect to worker ${worker.name} at ${workerUrl}:`,
        error
      )
    }
  }

  /**
   * Perform pre-flight health check on workers
   */
  private async performPreflightCheck(workers: any[]): Promise<any[]> {
    if (workers.length === 0) return []

    console.log(
      `Performing pre-flight health check on ${workers.length} workers...`
    )
    const startTime = Date.now()

    const checkPromises = workers.map(async (worker: any) => {
      const url = worker.connection || `http://${worker.host}:${worker.port}`
      const checkUrl = `${url}/prompt`

      try {
        const response = await fetch(checkUrl, {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })

        if (response.ok) {
          console.log(`Worker ${worker.name} is active`)
          return { worker, active: true }
        } else {
          console.log(`Worker ${worker.name} returned ${response.status}`)
          return { worker, active: false }
        }
      } catch (error) {
        console.log(`Worker ${worker.name} is offline or unreachable:`, error)
        return { worker, active: false }
      }
    })

    const results = await Promise.all(checkPromises)
    const activeWorkers = results.filter((r) => r.active).map((r) => r.worker)

    const elapsed = Date.now() - startTime
    console.log(
      `Pre-flight check completed in ${elapsed}ms. Active workers: ${activeWorkers.length}/${workers.length}`
    )

    return activeWorkers
  }

  /**
   * Clean up resources
   */
  public destroy() {
    // Restore original queuePrompt if we have it
    if (this.originalQueuePrompt) {
      const comfyAPI = (window as any).app?.api
      if (comfyAPI) {
        comfyAPI.queuePrompt = this.originalQueuePrompt
      }
    }

    // Clear caches
    this.imageCache.clear()

    console.log('Execution service destroyed')
  }
}
