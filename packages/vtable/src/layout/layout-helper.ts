import type { PivotTable } from '../PivotTable';
import { IndicatorDimensionKeyPlaceholder } from '../tools/global';
import { AggregationType } from '../ts-types';
import type { PivotTableConstructorOptions, Aggregation, IHeaderTreeDefine, IIndicator } from '../ts-types';
import type { ColumnData } from '../ts-types/list-table/layout-map/api';
import type { IChartColumnIndicator } from '../ts-types/pivot-table/indicator/chart-indicator';
import type { SimpleHeaderLayoutMap } from './simple-header-layout';
import type { ITreeLayoutHeadNode } from './tree-helper';
import { DimensionTree } from './tree-helper';

export function checkHasAggregation(layoutMap: SimpleHeaderLayoutMap) {
  const columnObjects = layoutMap.columnObjects;
  for (let i = 0; i < columnObjects.length; i++) {
    const column = columnObjects[i];
    if ((column as ColumnData)?.aggregation) {
      return true;
    }
  }
  return false;
}

export function checkHasAggregationOnTop(layoutMap: SimpleHeaderLayoutMap) {
  const columnObjects = layoutMap.columnObjects;
  let count = 0;
  for (let i = 0; i < columnObjects.length; i++) {
    const column = columnObjects[i];
    if ((column as ColumnData)?.aggregation) {
      if (Array.isArray((column as ColumnData)?.aggregation)) {
        count = Math.max(
          count,
          ((column as ColumnData).aggregation as Array<Aggregation>).filter(item => item.showOnTop === true).length
        );
      } else if (((column as ColumnData).aggregation as Aggregation).showOnTop === true) {
        count = Math.max(count, 1);
      }
    }
  }
  return count;
}

export function checkHasAggregationOnBottom(layoutMap: SimpleHeaderLayoutMap) {
  const columnObjects = layoutMap.columnObjects;
  let count = 0;
  for (let i = 0; i < columnObjects.length; i++) {
    const column = columnObjects[i];
    if ((column as ColumnData)?.aggregation) {
      if (Array.isArray((column as ColumnData)?.aggregation)) {
        count = Math.max(
          count,
          ((column as ColumnData).aggregation as Array<Aggregation>).filter(item => item.showOnTop === false).length
        );
      } else if (((column as ColumnData).aggregation as Aggregation).showOnTop === false) {
        count = Math.max(count, 1);
      }
    }
  }
  return count;
}

export function checkHasTreeDefine(layoutMap: SimpleHeaderLayoutMap) {
  const columnObjects = layoutMap.columnObjects;
  for (let i = 0; i < columnObjects.length; i++) {
    const column = columnObjects[i];
    if ((column as ColumnData)?.define?.tree) {
      return true;
    }
  }
  return false;
}

export function parseColKeyRowKeyForPivotTable(table: PivotTable, options: PivotTableConstructorOptions) {
  let columnDimensionTree;
  let rowDimensionTree;
  let isNeedResetColumnDimensionTree = true;
  let isNeedResetRowDimensionTree = true;
  if (options.columnTree) {
    if (table.options.indicatorsAsCol !== false && table.options.supplementIndicatorNodes !== false) {
      table.internalProps.columnTree = supplementIndicatorNodesForCustomTree(
        table.internalProps.columnTree,
        options.indicators
      );
    }
    columnDimensionTree = new DimensionTree(
      (table.internalProps.columnTree as ITreeLayoutHeadNode[]) ?? [],
      table.layoutNodeId
    );

    if (
      table.options.supplementIndicatorNodes !== false &&
      table.options.indicatorsAsCol !== false &&
      !columnDimensionTree.dimensionKeys.contain(IndicatorDimensionKeyPlaceholder) &&
      options.indicators?.length >= 1
    ) {
      isNeedResetColumnDimensionTree = true;
    } else {
      isNeedResetColumnDimensionTree = false;
    }
  }
  if (options.rowTree) {
    if (table.options.indicatorsAsCol === false && table.options.supplementIndicatorNodes !== false) {
      table.internalProps.rowTree = supplementIndicatorNodesForCustomTree(
        table.internalProps.rowTree,
        options.indicators
      );
    }
    rowDimensionTree = new DimensionTree(
      (table.internalProps.rowTree as ITreeLayoutHeadNode[]) ?? [],
      table.layoutNodeId,
      table.options.rowHierarchyType,
      table.options.rowHierarchyType === 'tree' ? table.options.rowExpandLevel ?? 1 : undefined
    );
    if (
      table.options.supplementIndicatorNodes !== false &&
      table.options.indicatorsAsCol === false &&
      !rowDimensionTree.dimensionKeys.contain(IndicatorDimensionKeyPlaceholder) &&
      options.indicators?.length >= 1
    ) {
      isNeedResetRowDimensionTree = true;
    } else {
      isNeedResetRowDimensionTree = false;
    }
  }
  const rowKeys = rowDimensionTree?.dimensionKeys?.count
    ? rowDimensionTree.dimensionKeys.valueArr()
    : options.rows?.reduce((keys: string[], rowObj) => {
        if (typeof rowObj === 'string') {
          keys.push(rowObj);
        } else {
          keys.push(rowObj.dimensionKey);
        }
        return keys;
      }, []) ?? [];
  const columnKeys = columnDimensionTree?.dimensionKeys?.count
    ? columnDimensionTree.dimensionKeys.valueArr()
    : options.columns?.reduce((keys: string[], columnObj) => {
        if (typeof columnObj === 'string') {
          keys.push(columnObj);
        } else {
          keys.push(columnObj.dimensionKey);
        }
        return keys;
      }, []) ?? [];
  const indicatorKeys =
    options.indicators?.reduce((keys: string[], indicatorObj) => {
      if (typeof indicatorObj === 'string') {
        keys.push(indicatorObj);
      } else {
        keys.push(indicatorObj.indicatorKey);
        if ((indicatorObj as IChartColumnIndicator).chartSpec) {
          if (table.internalProps.dataConfig?.aggregationRules) {
            table.internalProps.dataConfig?.aggregationRules.push({
              field: indicatorObj.indicatorKey,
              indicatorKey: indicatorObj.indicatorKey,
              aggregationType: AggregationType.NONE
            });
          } else if (table.internalProps.dataConfig) {
            table.internalProps.dataConfig.aggregationRules = [
              {
                field: indicatorObj.indicatorKey,
                indicatorKey: indicatorObj.indicatorKey,
                aggregationType: AggregationType.NONE
              }
            ];
          } else {
            table.internalProps.dataConfig = {
              aggregationRules: [
                {
                  field: indicatorObj.indicatorKey,
                  indicatorKey: indicatorObj.indicatorKey,
                  aggregationType: AggregationType.NONE
                }
              ]
            };
          }
        }
      }
      return keys;
    }, []) ?? [];
  if (options.rowHierarchyType === 'tree' && (options.extensionRows?.length ?? 0) >= 1) {
    options.extensionRows?.forEach(extensionRow => {
      const extension_rowKeys: string[] = [];
      extensionRow.rows.forEach(row => {
        if (typeof row === 'string') {
          extension_rowKeys.push(row);
        } else {
          extension_rowKeys.push(row.dimensionKey);
        }
      });
      rowKeys.push(...extension_rowKeys);
    });
  }
  return {
    rowKeys,
    columnKeys,
    indicatorKeys,
    isNeedResetColumnDimensionTree,
    isNeedResetRowDimensionTree,
    columnDimensionTree,
    rowDimensionTree
  };
}

export function supplementIndicatorNodesForCustomTree(
  customTree: IHeaderTreeDefine[],
  indicators: (string | IIndicator)[]
) {
  const checkNode = (nodes: IHeaderTreeDefine[], isHasIndicator: boolean) => {
    nodes.forEach((node: IHeaderTreeDefine) => {
      if (
        !node.indicatorKey &&
        !isHasIndicator &&
        (!(node.children as IHeaderTreeDefine[])?.length || !node.children)
      ) {
        node.children = indicators?.map((indicator: IIndicator | string): { indicatorKey: string; value: string } => {
          if (typeof indicator === 'string') {
            return { indicatorKey: indicator, value: indicator };
          }
          return { indicatorKey: indicator.indicatorKey, value: indicator.title ?? indicator.indicatorKey };
        });
      } else if (node.children && Array.isArray(node.children)) {
        checkNode(node.children, isHasIndicator || !!node.indicatorKey);
      }
    });
  };
  if (customTree?.length) {
    checkNode(customTree, false);
  } else {
    customTree = indicators?.map((indicator: IIndicator | string): { indicatorKey: string; value: string } => {
      if (typeof indicator === 'string') {
        return { indicatorKey: indicator, value: indicator };
      }
      return { indicatorKey: indicator.indicatorKey, value: indicator.title ?? indicator.indicatorKey };
    });
  }
  return customTree;
}
