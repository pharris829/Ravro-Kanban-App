const SLICE_COLORS = ['#6b7280', '#6fe9a4', '#64b5f6', '#f6c94a'];

function PieChart({ columns }) {
  const total = columns.reduce((s, c) => s + c.cards.length, 0);
  const cx = 80, cy = 80, r = 62, innerR = 38;

  if (total === 0) {
    return (
      <div className="pie-empty">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="24" />
        </svg>
        <span className="pie-empty-label">No cards yet</span>
      </div>
    );
  }

  let angle = -Math.PI / 2;
  const slices = [];
  columns.forEach((col, i) => {
    if (!col.cards.length) return;
    const fraction = col.cards.length / total;
    const sweep = fraction * 2 * Math.PI;
    const endAngle = angle + sweep;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    // Full circle when only one slice
    const path = fraction > 0.9999
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    slices.push({ col, color: SLICE_COLORS[i % SLICE_COLORS.length], path, count: col.cards.length, pct: Math.round(fraction * 100) });
    angle = endAngle;
  });

  return (
    <div className="pie-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        <circle cx={cx} cy={cy} r={innerR} fill="var(--surface)" />
        <text x={cx} y={cy + 6} textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="var(--text-muted)" fontSize="9" letterSpacing="0.05em">CARDS</text>
      </svg>
      <div className="pie-legend">
        {slices.map((s, i) => (
          <div key={i} className="pie-legend-row">
            <span className="pie-dot" style={{ background: s.color }} />
            <span className="pie-col-name">{s.col.title}</span>
            <span className="pie-col-count">{s.count}</span>
            <span className="pie-col-pct">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TitleCard({ columns, projectData, onUpdateProject, onOpenProject }) {
  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <div className="dashboard-header-row">
          <div className="dashboard-logo">RK</div>
          <input
            className="dashboard-title-input"
            value={projectData.title}
            onChange={e => onUpdateProject({ title: e.target.value })}
            placeholder="Project Title"
          />
        </div>

        <div className="dashboard-body">
          <div className="dashboard-toc-col">
            <div className="dashboard-label">Table of Contents</div>
            <textarea
              className="dashboard-toc"
              value={projectData.toc}
              onChange={e => onUpdateProject({ toc: e.target.value })}
              placeholder={"1. Overview\n2. Milestones\n3. Tasks\n4. Notes"}
            />
          </div>

          <div className="dashboard-chart-col">
            <div className="dashboard-label">Progress</div>
            <PieChart columns={columns} />
          </div>
        </div>

        <div className="dashboard-footer">
          <button className="btn-open-project" onClick={onOpenProject}>
            Open Project →
          </button>
        </div>
      </div>
    </div>
  );
}
