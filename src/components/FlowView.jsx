import { useCallback, useRef, useState, useContext, createContext } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import SubCardModal from './SubCardModal';

const COL_ACCENT = {
  'backlog':     '#6b7280',
  'in-progress': '#6fe9a4',
  'review':      '#64b5f6',
  'done':        '#f6c94a',
};

// Context lets CardNode call back into FlowView without stuffing functions in node data
const FlowCtx = createContext(null);

/* ── Custom node ──────────────────────────────── */
function CardNode({ data }) {
  const { updateCardInFlow } = useContext(FlowCtx);
  const [openSubcard, setOpenSubcard] = useState(null);
  const accent = COL_ACCENT[data.colId] || '#6b7280';
  const subcards = data.subcards || [];

  const addSubcard = (e) => {
    e.stopPropagation();
    const sub = { id: `sc-${Date.now()}`, title: 'New note', content: '' };
    updateCardInFlow(data.colId, data.cardId, { subcards: [...subcards, sub] });
    setOpenSubcard(sub);
  };

  const saveSubcard = (updated) => {
    updateCardInFlow(data.colId, data.cardId, {
      subcards: subcards.map(s => s.id === updated.id ? updated : s),
    });
    setOpenSubcard(updated);
  };

  const deleteSubcard = (id) => {
    updateCardInFlow(data.colId, data.cardId, {
      subcards: subcards.filter(s => s.id !== id),
    });
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: accent, border: 'none', width: 10, height: 10 }}
      />
      <div className="flow-card">
        <div className="flow-card-stripe" style={{ background: accent }} />
        <div className="flow-card-title">{data.label}</div>

        {subcards.length > 0 && (
          <div className="flow-subcard-chips">
            {subcards.map(s => (
              <button
                key={s.id}
                className="flow-subcard-chip"
                onClick={e => { e.stopPropagation(); setOpenSubcard(s); }}
                title={s.content || 'Empty note'}
              >
                ◉ {s.title}
              </button>
            ))}
          </div>
        )}

        <button className="btn-flow-add-note" onClick={addSubcard}>+ Note</button>

        <div className="flow-card-sub" style={{ color: accent }}>{data.colTitle}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: accent, border: 'none', width: 10, height: 10 }}
      />

      {/* Portal escapes React Flow's CSS transform so the modal positions correctly */}
      {openSubcard && createPortal(
        <SubCardModal
          subcard={openSubcard}
          onSave={saveSubcard}
          onDelete={deleteSubcard}
          onClose={() => setOpenSubcard(null)}
        />,
        document.body
      )}
    </>
  );
}

/* ── Custom gradient edge ─────────────────────── */
function GradientEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const gradId = `fg-${id}`;
  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6a5af9" />
          <stop offset="100%" stopColor="#ff6ec7" />
        </linearGradient>
      </defs>
      <path
        className="flow-edge-path"
        d={edgePath}
        stroke={`url(#${gradId})`}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

const nodeTypes = { cardNode: CardNode };
const edgeTypes = { gradient: GradientEdge };

function buildInitialNodes(columns, positions) {
  return columns.flatMap((col, colIdx) =>
    col.cards.map((card, cardIdx) => ({
      id: card.id,
      type: 'cardNode',
      position: positions[card.id] || { x: colIdx * 330, y: cardIdx * 175 + 40 },
      data: {
        label: card.text,
        colTitle: col.title,
        colId: col.id,
        cardId: card.id,
        subcards: card.subcards || [],
      },
    }))
  );
}

export default function FlowView({ columns, flowData, onSaveFlow, onBack, onUpdateCard }) {
  const flowRef = useRef({
    positions: flowData.positions || {},
    edges: flowData.edges || [],
  });

  const initEdges = (flowData.edges || []).map(e => ({ ...e, type: 'gradient' }));

  const [nodes, setNodes, onNodesChange] = useNodesState(
    buildInitialNodes(columns, flowRef.current.positions)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  // Updates both the React Flow node data (local visual) and the parent columns state (persistence)
  const updateCardInFlow = useCallback((colId, cardId, updates) => {
    setNodes(nds => nds.map(n =>
      n.id === cardId ? { ...n, data: { ...n.data, ...updates } } : n
    ));
    onUpdateCard(colId, cardId, updates);
  }, [setNodes, onUpdateCard]);

  const save = useCallback((flow) => {
    flowRef.current = flow;
    onSaveFlow(flow);
  }, [onSaveFlow]);

  const onConnect = useCallback((params) => {
    setEdges(eds => {
      const next = addEdge({ ...params, type: 'gradient' }, eds);
      save({ ...flowRef.current, edges: next });
      return next;
    });
  }, [setEdges, save]);

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    const removedIds = new Set(changes.filter(c => c.type === 'remove').map(c => c.id));
    if (removedIds.size > 0) {
      const next = flowRef.current.edges.filter(e => !removedIds.has(e.id));
      save({ ...flowRef.current, edges: next });
    }
  }, [onEdgesChange, save]);

  const onNodeDragStop = useCallback((_e, _node, allNodes) => {
    const positions = {};
    allNodes.forEach(n => { positions[n.id] = n.position; });
    save({ ...flowRef.current, positions });
  }, [save]);

  return (
    <FlowCtx.Provider value={{ updateCardInFlow }}>
      <div className="flow-view">
        <div className="flow-topbar">
          <button className="btn-flow-back" onClick={onBack}>← Board</button>
          <button className="btn-flow-back" onClick={() => window.location.reload()} title="Reload">↻</button>
          <span className="flow-title">Flow View</span>
          <span className="flow-hint">Drag handles to connect · Select + Delete removes edges</span>
        </div>
        <div className="flow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            fitView
            deleteKeyCode="Delete"
            style={{ background: '#f0f2f5' }}
          >
            <Background color="#d0d4dc" gap={28} size={1.5} variant="dots" />
            <Controls />
            <MiniMap
              nodeColor={() => '#ffffff'}
              nodeStrokeColor={(n) => COL_ACCENT[n.data?.colId] || '#ccc'}
              nodeStrokeWidth={2}
              maskColor="rgba(200,205,215,0.6)"
              style={{ background: '#f5f6f8', border: '1px solid #dde', borderRadius: '6px' }}
            />
          </ReactFlow>
        </div>
      </div>
    </FlowCtx.Provider>
  );
}
