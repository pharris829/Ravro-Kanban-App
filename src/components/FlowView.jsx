import { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

const COL_ACCENT = {
  'backlog':     '#6b7280',
  'in-progress': '#6fe9a4',
  'review':      '#64b5f6',
  'done':        '#f6c94a',
};

function CardNode({ data }) {
  const accent = COL_ACCENT[data.colId] || '#6b7280';
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: accent, border: 'none', width: 8, height: 8 }}
      />
      <div className="flow-card-node" style={{ borderLeftColor: accent }}>
        <div className="flow-node-col" style={{ color: accent }}>{data.colTitle}</div>
        <div className="flow-node-text">{data.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: accent, border: 'none', width: 8, height: 8 }}
      />
    </>
  );
}

const nodeTypes = { cardNode: CardNode };

function buildInitialNodes(columns, positions) {
  return columns.flatMap((col, colIdx) =>
    col.cards.map((card, cardIdx) => ({
      id: card.id,
      type: 'cardNode',
      position: positions[card.id] || { x: colIdx * 290, y: cardIdx * 120 + 40 },
      data: { label: card.text, colTitle: col.title, colId: col.id },
    }))
  );
}

export default function FlowView({ columns, flowData, onSaveFlow, onBack }) {
  // flowRef tracks current positions+edges for use inside callbacks without stale closures
  const flowRef = useRef({
    positions: flowData.positions || {},
    edges: flowData.edges || [],
  });

  const [nodes, , onNodesChange] = useNodesState(
    buildInitialNodes(columns, flowRef.current.positions)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowRef.current.edges);

  const save = useCallback(() => {
    onSaveFlow({ ...flowRef.current });
  }, [onSaveFlow]);

  const onConnect = useCallback((params) => {
    setEdges(eds => {
      const next = addEdge(
        { ...params, animated: true, style: { stroke: '#6fe9a4', strokeWidth: 1.5 } },
        eds
      );
      flowRef.current.edges = next;
      onSaveFlow(flowRef.current);
      return next;
    });
  }, [setEdges, onSaveFlow]);

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    const removedIds = new Set(
      changes.filter(c => c.type === 'remove').map(c => c.id)
    );
    if (removedIds.size > 0) {
      flowRef.current.edges = flowRef.current.edges.filter(e => !removedIds.has(e.id));
      onSaveFlow(flowRef.current);
    }
  }, [onEdgesChange, onSaveFlow]);

  const onNodeDragStop = useCallback((_e, _node, allNodes) => {
    const positions = {};
    allNodes.forEach(n => { positions[n.id] = n.position; });
    flowRef.current.positions = positions;
    onSaveFlow(flowRef.current);
  }, [onSaveFlow]);

  return (
    <div className="flow-view">
      <div className="flow-topbar">
        <button className="btn-flow-back" onClick={onBack}>← Board</button>
        <span className="flow-title">Flow View</span>
        <span className="flow-hint">Drag node handles to connect · Select + Delete to remove edges</span>
      </div>
      <div className="flow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          fitView
          deleteKeyCode="Delete"
        >
          <Background color="#252525" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={0}
            nodeColor={(n) => COL_ACCENT[n.data?.colId] || '#2a2a2a'}
            maskColor="rgba(0,0,0,0.65)"
            style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '6px' }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
