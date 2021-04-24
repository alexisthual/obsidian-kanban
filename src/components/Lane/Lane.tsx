import update from "immutability-helper";
import React from "react";
import {
  Droppable,
  DroppableProvided,
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  DraggableRubric,
  DroppableStateSnapshot,
} from "react-beautiful-dnd";
import { Item, Lane } from "../types";
import { c } from "../helpers";
import { draggableItemFactory, ItemContent } from "../Item/Item";
import { ItemForm } from "../Item/ItemForm";
import { LaneHeader } from "./LaneHeader";
import { Icon } from "../Icon/Icon";
import { KanbanContext } from "../context";

export interface DraggableLaneFactoryParams {
  lanes: Lane[];
  isGhost?: boolean;
}

interface LaneItemsProps {
  isGhost?: boolean;
  items: Item[];
  laneId: string;
  laneIndex: number;
  shouldShowArchiveButton: boolean;
}

function LaneItems({
  isGhost,
  items,
  laneId,
  laneIndex,
  shouldShowArchiveButton,
}: LaneItemsProps) {
  const renderItem = draggableItemFactory({
    laneIndex,
    items,
    shouldShowArchiveButton,
  });

  if (isGhost) {
    return (
      <div className={c("lane-items")}>
        {items.map((item, i) => {
          return (
            <div key={i} className={c("item")}>
              <div className={c("item-content-wrapper")}>
                <ItemContent isSettingsVisible={false} item={item} />
                <div className={c("item-edit-button-wrapper")}>
                  {shouldShowArchiveButton && (
                    <button className={`${c("item-edit-button")}`}>
                      <Icon name="sheets-in-box" />
                    </button>
                  )}
                  <button className={`${c("item-edit-button")}`}>
                    <Icon name="pencil" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Droppable droppableId={laneId} type="ITEM" renderClone={renderItem}>
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
        <div
          className={`${c("lane-items")} ${
            snapshot.isDraggingOver ? "is-dragging-over" : ""
          }`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {items.map((item, i) => {
            return (
              <Draggable draggableId={item.id} key={item.id} index={i}>
                {renderItem}
              </Draggable>
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export function draggableLaneFactory({
  lanes,
  isGhost,
}: DraggableLaneFactoryParams) {
  return (
    provided: DraggableProvided,
    snapshot: DraggableStateSnapshot,
    rubric: DraggableRubric
  ) => {
    const { boardModifiers } = React.useContext(KanbanContext);
    const lane = lanes[rubric.source.index];
    const shouldShowArchiveButton = !!lane.data.shouldMarkItemsComplete;

    return (
      <div
        className={`${c("lane")} ${snapshot.isDragging ? "is-dragging" : ""}`}
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <LaneHeader
          dragHandleProps={provided.dragHandleProps}
          laneIndex={rubric.source.index}
          lane={lane}
        />
        <LaneItems
          laneId={lane.id}
          items={lane.items}
          laneIndex={rubric.source.index}
          isGhost={isGhost}
          shouldShowArchiveButton={shouldShowArchiveButton}
        />
        <ItemForm
          addItem={(item: Item) => {
            boardModifiers.addItemToLane(
              rubric.source.index,
              update(item, {
                data: {
                  isComplete: {
                    // Mark the item complete if we're moving into a completed lane
                    $set: !!lane.data.shouldMarkItemsComplete,
                  },
                },
              })
            );
          }}
        />
      </div>
    );
  };
}