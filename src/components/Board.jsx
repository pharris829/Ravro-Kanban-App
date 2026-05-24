import Column from './Column';

export default function Board({ columns, onAddCard, onMoveCard, onDeleteCard, onUpdateCard, onAddCards }) {
  return (
    <main className="board">
      {columns.map((col, i) => (
        <Column
          key={col.id}
          col={col}
          colIndex={i}
          totalCols={columns.length}
          onAddCard={onAddCard}
          onMoveCard={onMoveCard}
          onDeleteCard={onDeleteCard}
          onUpdateCard={onUpdateCard}
          onAddCards={onAddCards}
        />
      ))}
    </main>
  );
}
