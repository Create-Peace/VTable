import { isValid } from '@visactor/vutils';
import { getTextPos } from '../gantt-helper';
import { toBoxArray } from '../tools/util';
import type { Scenegraph } from './scenegraph';
import { VRender } from '@visactor/vtable';
export class TimelineHeader {
  group: VRender.Group;
  _scene: Scenegraph;
  constructor(scene: Scenegraph) {
    this._scene = scene;
    const dateHeader = new VRender.Group({
      x: 0,
      y: 0,
      width: scene._gantt.getAllColsWidth(), //width - 2,
      height: scene._gantt.parsedOptions.headerRowHeight * scene._gantt.headerLevel,
      clip: true,
      pickable: false
      // fill: 'purple',
      // stroke: 'green',
      // lineWidth: 2
    });
    this.group = dateHeader;
    dateHeader.name = 'date-header-container';
    scene.tableGroup.addChild(this.group);
    const y = 0;
    for (let i = 0; i < scene._gantt.headerLevel; i++) {
      const rowHeader = new VRender.Group({
        x: 0,
        y: scene._gantt.parsedOptions.headerRowHeight * i,
        width: scene._gantt.getAllColsWidth(),
        height: scene._gantt.parsedOptions.headerRowHeight,
        clip: false
      });
      rowHeader.name = 'row-header';
      dateHeader.addChild(rowHeader);

      const { unit, timelineDates, customLayout } = scene._gantt.sortedTimelineScales[i];
      let x = 0;
      for (let j = 0; j < timelineDates.length; j++) {
        const { days, endDate, startDate, title, dateIndex } = timelineDates[j];
        const date = new VRender.Group({
          x,
          y: 0,
          width: scene._gantt.parsedOptions.colWidthPerDay * days,
          height: scene._gantt.parsedOptions.headerRowHeight,
          clip: false,
          fill: scene._gantt.parsedOptions.timelineHeaderStyle?.backgroundColor
        });
        date.name = 'date-cell';
        // const rect = createRect({
        //   x: 0,
        //   y: 0,
        //   width: scene._gantt.parsedOptions.colWidthPerDay * timelineDates[j].days,
        //   height: scene._gantt.parsedOptions.headerRowHeight,
        //   fill: scene._gantt.parsedOptions.timelineHeaderStyle?.backgroundColor
        // });
        // date.appendChild(rect);
        let rootContainer;
        let renderDefaultText = true;
        const width = scene._gantt.parsedOptions.colWidthPerDay * timelineDates[j].days;
        const height = scene._gantt.parsedOptions.headerRowHeight;
        if (customLayout) {
          let customLayoutObj;
          if (typeof customLayout === 'function') {
            const arg = {
              width,
              height,
              index: j,
              startDate,
              endDate,
              days,
              dateIndex,
              title,
              ganttInstance: this._scene._gantt
            };
            customLayoutObj = customLayout(arg);
          } else {
            customLayoutObj = customLayout;
          }
          if (customLayoutObj) {
            // if (customLayoutObj.rootContainer) {
            //   customLayoutObj.rootContainer = decodeReactDom(customLayoutObj.rootContainer);
            // }
            rootContainer = customLayoutObj.rootContainer;
            renderDefaultText = customLayoutObj.renderDefaultText ?? false;
            rootContainer.name = 'task-bar-custom-render';
          }
          rootContainer && date.appendChild(rootContainer);
        }
        if (renderDefaultText) {
          const { padding, textAlign, textBaseline, textOverflow, fontSize, fontWeight, color, strokeColor } =
            scene._gantt.parsedOptions.timelineHeaderStyle;

          const position = getTextPos(toBoxArray(padding), textAlign, textBaseline, width, height);
          const text = new VRender.Text({
            x: position.x,
            y: position.y,
            maxLineWidth: width,
            // width: scene._gantt.parsedOptions.colWidthPerDay * timelineDates[j].days,
            heightLimit: height,
            // clip: true,
            pickable: true,
            text: title.toLocaleString(),
            fontSize: fontSize,

            fontWeight: fontWeight,
            fill: color,
            stroke: strokeColor,
            lineWidth: 2,
            textAlign,
            textBaseline,
            ellipsis:
              textOverflow === 'clip'
                ? ''
                : textOverflow === 'ellipsis'
                ? '...'
                : isValid(textOverflow)
                ? textOverflow
                : undefined
          });
          date.appendChild(text);
        }
        rowHeader.addChild(date);

        if (j > 0) {
          const line = VRender.createLine({
            pickable: false,
            stroke: scene._gantt.parsedOptions.timelineHeaderStyle?.borderColor,
            lineWidth: scene._gantt.parsedOptions.timelineHeaderStyle?.borderWidth,
            points: [
              { x: scene._gantt.parsedOptions.timelineHeaderStyle?.borderWidth & 1 ? 0.5 : 0, y: 0 },
              {
                x: scene._gantt.parsedOptions.timelineHeaderStyle?.borderWidth & 1 ? 0.5 : 0,
                y: scene._gantt.parsedOptions.headerRowHeight
              }
            ]
          });
          date.appendChild(line);
        }
        x += width;
      }
      //创建表头分割线 水平分割线 TODO
      if (i > 0) {
        const line = VRender.createLine({
          pickable: false,
          stroke: scene._gantt.parsedOptions.timelineHeaderStyle?.borderColor,
          lineWidth: scene._gantt.parsedOptions.timelineHeaderStyle?.borderWidth,
          points: [
            { x: 0, y: scene._gantt.parsedOptions.timelineHeaderStyle?.borderWidth & 1 ? 0.5 : 0 },
            {
              x: scene._gantt.getAllColsWidth(),
              y: scene._gantt.parsedOptions.timelineHeaderStyle?.borderWidth & 1 ? 0.5 : 0
            }
          ]
        });
        rowHeader.addChild(line);
      }
    }
  }
  setX(x: number) {
    this.group.setAttribute('x', x);
  }
  setY(y: number) {
    this.group.setAttribute('y', y);
  }
  resize() {
    this.group.setAttribute('width', this.group.attribute?.width ?? 0);
    this.group.setAttribute('height', this.group.attribute?.height ?? 0);
  }
}
