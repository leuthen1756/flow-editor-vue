import AbstractPlugin from './AbstractPlugin'
import ORYX_Config from '../CONFIG'
import ORYX_Edge from '../core/Edge'
import ORYX_Node from '../core/Node'
import ORYX_Command from '../core/Command'
import ORYX_Move from '../core/Move'
import ORYX_Controls from '../core/Controls/index'

export default class KeysMove extends AbstractPlugin {
  constructor (facade) {
    super(facade)
    this.facade = facade
    this.copyElements = []

    // this.facade.registerOnEvent(ORYX.CONFIG.EVENT_KEYDOWN, this.keyHandler.bind(this));

    // 参数
    // SELECT ALL
    this.facade.offer({
      keyCodes: [{
        metaKeys: [ORYX_Config.META_KEY_META_CTRL],
        keyCode: 65,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.selectAll.bind(this)
    })

    // MOVE LEFT SMALL
    this.facade.offer({
      keyCodes: [{
        metaKeys: [ORYX_Config.META_KEY_META_CTRL],
        keyCode: ORYX_Config.KEY_CODE_LEFT,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.move.bind(this, ORYX_Config.KEY_CODE_LEFT, false)
    })

    // MOVE LEFT
    this.facade.offer({
      keyCodes: [{
        keyCode: ORYX_Config.KEY_CODE_LEFT,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.move.bind(this, ORYX_Config.KEY_CODE_LEFT, true)
    })

    // MOVE RIGHT SMALL
    this.facade.offer({
      keyCodes: [{
        metaKeys: [ORYX_Config.META_KEY_META_CTRL],
        keyCode: ORYX_Config.KEY_CODE_RIGHT,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.move.bind(this, ORYX_Config.KEY_CODE_RIGHT, false)
    })

    // MOVE RIGHT
    this.facade.offer({
      keyCodes: [{
        keyCode: ORYX_Config.KEY_CODE_RIGHT,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.move.bind(this, ORYX_Config.KEY_CODE_RIGHT, true)
    })

    // MOVE UP SMALL
    this.facade.offer({
      keyCodes: [{
        metaKeys: [ORYX_Config.META_KEY_META_CTRL],
        keyCode: ORYX_Config.KEY_CODE_UP,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.move.bind(this, ORYX_Config.KEY_CODE_UP, false)
    })

    // MOVE UP
    this.facade.offer({
      keyCodes: [{
        keyCode: ORYX_Config.KEY_CODE_UP,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.move.bind(this, ORYX_Config.KEY_CODE_UP, true)
    })

    // MOVE DOWN SMALL
    this.facade.offer({
      keyCodes: [{
        metaKeys: [ORYX_Config.META_KEY_META_CTRL],
        keyCode: ORYX_Config.KEY_CODE_DOWN,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.move.bind(this, ORYX_Config.KEY_CODE_DOWN, false)
    })

    // MOVE DOWN
    this.facade.offer({
      keyCodes: [{
        keyCode: ORYX_Config.KEY_CODE_DOWN,
        keyAction: ORYX_Config.KEY_ACTION_DOWN
      }
      ],
      functionality: this.move.bind(this, ORYX_Config.KEY_CODE_DOWN, true)
    })
  }

  /**
   * Select all shapes in the editor
   *
   */
  selectAll (e) {
    Event.stop(e.event)
    this.facade.setSelection(this.facade.getCanvas().getChildShapes(true))
  }

  move (key, far, e) {
    Event.stop(e.event)
    // calculate the distance to move the objects and get the selection.
    let distance = far ? 4 * ORYX_Config.CustomConfigs.UI_CONFIG.PX_OFFSET : 1
    let selection = this.facade.getSelection()
    let currentSelection = this.facade.getSelection()
    let p = { x: 0, y: 0 }

    // switch on the key pressed and populate the point to move by.
    switch (key) {
      case ORYX_Config.KEY_CODE_LEFT:
        p.x = -1 * distance
        break
      case ORYX_Config.KEY_CODE_RIGHT:
        p.x = distance
        break
      case ORYX_Config.KEY_CODE_UP:
        p.y = -1 * distance
        break
      case ORYX_Config.KEY_CODE_DOWN:
        p.y = distance
        break
    }

    // move each shape in the selection by the point calculated and update it.
    selection = selection.findAll(function (shape) {
      // Check if this shape is docked to an shape in the selection
      if (shape instanceof ORYX_Node
        && shape.dockers.length === 1
        && selection.include(shape.dockers.first().getDockedShape())) {
        return false
      }

      // Check if any of the parent shape is included in the selection
      let s = shape.parent
      do {
        if (selection.include(s)) {
          return false
        }
      } while (s == s.parent)

      // Otherwise, return true
      return true
    })

    /* Edges must not be movable, if only edges are selected and at least
     * one of them is docked.
     */
    let edgesMovable = true
    let onlyEdgesSelected = selection.all(function (shape) {
      if (shape instanceof ORYX_Edge) {
        if (shape.isDocked()) {
          edgesMovable = false
        }
        return true
      }
      return false
    })

    if (onlyEdgesSelected && !edgesMovable) {
      /* Abort moving shapes */
      return
    }

    selection = selection.map(function (shape) {
      if (shape instanceof ORYX_Node) {
        /*if( shape.dockers.length == 1 ){
         return shape.dockers.first()
         } else {*/
        return shape
        //}
      } else if (shape instanceof ORYX_Edge) {
        let dockers = shape.dockers
        if (selection.include(shape.dockers.first().getDockedShape())) {
          dockers = dockers.without(shape.dockers.first())
        }

        if (selection.include(shape.dockers.last().getDockedShape())) {
          dockers = dockers.without(shape.dockers.last())
        }

        return dockers
      } else {
        return null
      }

    }).flatten().compact()

    if (selection.size() > 0) {
      // Stop moving at canvas borders
      let selectionBounds = [this.facade.getCanvas().bounds.lowerRight().x,
        this.facade.getCanvas().bounds.lowerRight().y,
        0,
        0]
      selection.each(function (s) {
        selectionBounds[0] = Math.min(selectionBounds[0], s.bounds.upperLeft().x)
        selectionBounds[1] = Math.min(selectionBounds[1], s.bounds.upperLeft().y)
        selectionBounds[2] = Math.max(selectionBounds[2], s.bounds.lowerRight().x)
        selectionBounds[3] = Math.max(selectionBounds[3], s.bounds.lowerRight().y)
      })
      if (selectionBounds[0] + p.x < 0)
        p.x = -selectionBounds[0]
      if (selectionBounds[1] + p.y < 0)
        p.y = -selectionBounds[1]
      if (selectionBounds[2] + p.x > this.facade.getCanvas().bounds.lowerRight().x)
        p.x = this.facade.getCanvas().bounds.lowerRight().x - selectionBounds[2]
      if (selectionBounds[3] + p.y > this.facade.getCanvas().bounds.lowerRight().y)
        p.y = this.facade.getCanvas().bounds.lowerRight().y - selectionBounds[3]

      if (p.x !== 0 || p.y !== 0) {
        // Instantiate the moveCommand
        const commands = [new ORYX_Move(selection, p, null, currentSelection, this)]
        // Execute the commands
        this.facade.executeCommands(commands)
      }

    }
  }

  getUndockedCommant (shapes) {
    class undockEdgeCommand extends ORYX_Command{
      constructor (moveShapes) {
        super()
        this.dockers = moveShapes.collect(function (shape) {
          return shape instanceof ORYX_Controls.Docker ? {
            docker: shape,
            dockedShape: shape.getDockedShape(),
            refPoint: shape.referencePoint
          } : undefined
        }).compact()
      }
      execute () {
        this.dockers.each(function (el) {
          el.docker.setDockedShape(undefined)
          console.log('setDockedShape')
        })
      }
      rollback () {
        this.dockers.each(function (el) {
          el.docker.setDockedShape(el.dockedShape)
          console.log('setDockedShape')
          el.docker.setReferencePoint(el.refPoint)
          //el.docker.update();
        })
      }
    }

    const command = new undockEdgeCommand(shapes)
    command.execute()
    return command
  }

  //    /**
  //     * The key handler for this plugin. Every action from the set of cut, copy,
  //     * paste and delete should be accessible trough simple keyboard shortcuts.
  //     * This method checks whether any event triggers one of those actions.
  //     *
  //     * @param {Object} event The keyboard event that should be analysed for
  //     *     triggering of this plugin.
  //     */
  //    keyHandler: function(event){
  //        //TODO document what event.which is.
  //
  //        ORYX.Log.debug("keysMove.js handles a keyEvent.");
  //
  //        // assure we have the current event.
  //        if (!event)
  //            event = window.event;
  //
  //        // get the currently pressed key and state of control key.
  //        var pressedKey = event.which || event.keyCode;
  //        var ctrlPressed = event.ctrlKey;
  //
  //		// if the key is one of the arrow keys, forward to move and return.
  //		if ([ORYX.CONFIG.KEY_CODE_LEFT, ORYX.CONFIG.KEY_CODE_RIGHT,
  //			ORYX.CONFIG.KEY_CODE_UP, ORYX.CONFIG.KEY_CODE_DOWN].include(pressedKey)) {
  //
  //			this.move(pressedKey, !ctrlPressed);
  //			return;
  //		}
  //
  //    }

}
