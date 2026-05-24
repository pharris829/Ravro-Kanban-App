export default function SplashScreen({ fadeOut }) {
  return (
    <div className={`splash${fadeOut ? ' fade-out' : ''}`}>
      <div className="kanban-logo-bg">
        <div className="kanban-board-logo">
          <div className="kanban-column-logo">
            <span className="kanban-card-logo" />
            <span className="kanban-card-logo" />
          </div>
          <div className="kanban-column-logo">
            <span className="kanban-card-logo" />
            <span className="kanban-card-logo" />
          </div>
          <div className="kanban-column-logo">
            <span className="kanban-card-logo" />
            <span className="kanban-card-logo" />
          </div>
        </div>
        <div className="kanban-text-logo">Kanban</div>
      </div>
    </div>
  );
}
