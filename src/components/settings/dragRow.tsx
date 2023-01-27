import React, {useRef} from 'react';
import {useDrag, useDrop} from 'react-dnd';

interface DraggableBodyRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
}
const type = 'DraggableBodyRow';

export const DraggableBodyRow = ({
                            index,
                            moveRow,
                            className,
                            style,
                            ...restProps
                          }: DraggableBodyRowProps) => {
  const ref = useRef<HTMLTableRowElement>(null);
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: type,
    collect: (monitor) => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
      };
    },
    drop: (item: { index: number }) => {
      moveRow(item.index, index);
    },
  });
  const [, drag] = useDrag({
    type,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drop(drag(ref));

  return (
      <tr
        ref={ref}
    className={`${className}${isOver ? dropClassName : ''}`}
    style={{ cursor: 'move', ...style }}
    {...restProps}
    />
  );
};
