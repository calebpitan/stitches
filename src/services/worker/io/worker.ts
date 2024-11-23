/// <reference lib="webworker" />
import { type StitchesIOConfig, type StitchesIOPort, open } from '@stitches/io'

import { expose } from 'comlink'

declare let self: SharedWorkerGlobalScope
declare type Connection = { io: StitchesIOPort; clients: Set<MessagePort> }

const pool: Map<string, Connection> = new Map()

class _IOController {
  private name!: string

  constructor(private readonly port: MessagePort) {}

  /**
   * Get the connection for this controller from the pool by its name
   *
   * @throws {Error} if no connection exists in the pool by the controller name
   */
  private get connection() {
    const connection = pool.get(this.name)
    if (!connection) {
      throw new Error(`No connection with name "${this.name}" was found`)
    }
    return connection
  }

  /**
   * Set the connection for this controller in the pool by its name
   *
   * @throws {Error} if a connection exists in the pool by the controller name
   */
  private set connection(value: Connection) {
    if (pool.has(this.name)) {
      throw new Error(`Connection with name "${this.name}" is already in pool`)
    }
    pool.set(this.name, value)
  }

  /**
   * Get the IO Port for this controller from the pre-established connection.
   *
   * NOTE: Throws an error by cascade if there's no existing connection. May also
   * throw an own-error if the contoller is not registered as a client on an existing
   * connection.
   *
   * @throws {Error} if no connection exists in the pool by the controller name or the
   * controller is not registered as a client on the connection
   */
  private get io() {
    if (!this.connection.clients.has(this.port)) throw new Error('Client not connected!')
    return this.connection.io
  }

  /**
   * Set the IO Port for this controller on the pre-established connection.
   *
   * NOTE: If no connection exists, adds a new connection by trial and error.
   */
  private set io(value: StitchesIOPort) {
    try {
      if (this.connection.clients.has(this.port)) {
        this.connection.io = value
        return
      }
      this.connection.io = value
      this.connection.clients.add(this.port)
    } catch (e) {
      this.connection = { io: value, clients: new Set([this.port]) }
    }
  }

  /**
   * Get the connected state of the controller by checking that the controller
   * is currently registered as a client, by its message port, in the connection
   * pool.
   */
  get isConnected() {
    try {
      return this.connection.clients.has(this.port)
    } catch (e) {
      return false
    }
  }

  private static async fetchDatabaseFromUrl(url: string) {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    return new Uint8Array(buffer)
  }

  /**
   * Connect to a database and optionally initialize it if not already initialized.
   *
   * NOTE: Calling connect more than once with the same name disconnects and drops
   * the existing connection and replaces it with a new connection.
   *
   * @param name The name of the controller which is used to acquire a connection in the pool
   * @param database The database binary representation
   * @param config The connection config
   * @returns `true`, when the connection is successful, otherwise `false`
   */
  connect(name: string, dburl: string, config?: StitchesIOConfig): Promise<boolean>
  connect(name: string, database: Uint8Array | string, config?: StitchesIOConfig): Promise<boolean>
  async connect(name: string, db: Uint8Array | string, config?: StitchesIOConfig) {
    this.name = name

    const database = typeof db === 'string' ? await _IOController.fetchDatabaseFromUrl(db) : db

    if (pool.has(name)) {
      await this.disconnect(true)
    }

    return await open(database, config)
      .then((io) => (this.io = io))
      .then((io) => io.migrate())
      .then(() => true)
  }

  /**
   * Disconnects a database connection if there are no more active clients on the connection
   * otherwise drop the current client from the connection.
   *
   * @param forced A boolean indicating whether to force-close a connection irrespective of other active clients
   * @returns `true`, when the disconnection is successful, otherwise `false`
   */
  async disconnect(forced: boolean = false) {
    if (!this.isConnected || !this.name) return false

    const connection = this.connection

    // Remove the client from the connection and update controller state
    connection.clients.delete(this.port)

    if (this.connection.clients.size === 0 || forced) {
      return Promise.resolve(connection.io.close()).then(() => pool.delete(this.name))
    }

    return Promise.resolve(true)
  }
}

self.addEventListener('connect', (e) => {
  const port = e.ports[0]
  const controller = new _IOController(port)

  expose(controller, port)
})

export declare interface IOController extends _IOController {}
