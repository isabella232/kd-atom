'use babel'
/* globals atom */

import { CompositeDisposable } from 'atom'
import debug from 'debug'
import config from './config'
import KD from './kd-states'
import KDController from './kd-controller'
import checkAtomDeps from './utils/check-atom-deps'
import StorageController from './controllers/storage-controller'

const log = debug('kd:log')
const error = debug('kd:err')

export default {
  kdController: null,

  config: config,

  activate(state) {
    log('kd activated!', state)
    this.subscriptions = new CompositeDisposable()
    this.storage = StorageController.make('KDController')

    this.kdController = new KDController(state)

    this.storage
      .deserialize(state)
      .then(data => {
        this.kdController.setData(data)
        this.kdController.consumeStatusBar(this.statusBarRegistry)
      })
      .catch(err => error('can not deserialize', err))

    this.subscriptions.add(
      atom.packages.onDidActivatePackage(pkg => {
        if (pkg.name === 'tree-view') {
          this.kdController.consumeTreeView(pkg)
        }
      })
    )

    KD.emitter.on('ready', this.bindEvents.bind(this))

    checkAtomDeps()
  },

  bindEvents() {
    let controller = this.kdController
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'kd:teams': () => {
          controller.showTeams()
        },
        'kd:machines': () => {
          controller.showMachines()
        },
        'kd:mounts': () => {
          controller.showMounts()
        },
        'kd:terminal': () => {
          controller.openTerminal({ machine: controller.getData().machine })
        },
        'kd:dashboard': () => {
          controller.statusBarItem.trigger('click')
        },
      })
    )
  },

  serialize() {
    return this.storage.serialize(this.kdController.getData())
  },

  deactivate() {
    this.statusBarRegistry = null
    this.subscriptions.dispose()
    this.kdController.destroy()
  },

  resetStorage() {
    this.storage.reset()
    this.kdController.reset()
  },

  consumeStatusBar(statusBar) {
    this.statusBarRegistry = statusBar
  },
}
