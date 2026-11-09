import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import "./workflow-analysis.css";

/* =========================================================================
   DATA STRUCTURES
   ========================================================================= */

/**
 * Queue – a FIFO data structure used for BFS traversal
 * and for modelling the request processing queue.
 */
class Queue {
    constructor() {
        this._items = [];
        this._head = 0;
    }
    enqueue(item) { this._items.push(item); }
    dequeue() { if (this.isEmpty()) return undefined; return this._items[this._head++]; }
    peek() { return this._items[this._head]; }
    isEmpty() { return this._head >= this._items.length; }
    get size() { return this._items.length - this._head; }
    toArray() { return this._items.slice(this._head); }
    clear() { this._items = []; this._head = 0; }
}

/**
 * Graph – adjacency-list representation of the barangay
 * document request workflow (a directed graph / state machine).
 */
class Graph {
    constructor() {
        this.adjacency = new Map();
        this.nodeData = new Map();
    }

    addNode(id, data = {}) {
        if (!this.adjacency.has(id)) this.adjacency.set(id, []);
        this.nodeData.set(id, data);
    }

    addEdge(from, to, label = "") {
        if (!this.adjacency.has(from)) this.addNode(from);
        if (!this.adjacency.has(to)) this.addNode(to);
        this.adjacency.get(from).push({ target: to, label });
    }

    neighbors(id) {
        return this.adjacency.get(id) || [];
    }

    get nodes() {
        return [...this.adjacency.keys()];
    }

    /** BFS using the Queue class */
    bfs(start) {
        const visited = new Set();
        const order = [];
        const q = new Queue();

        q.enqueue(start);
        visited.add(start);

        while (!q.isEmpty()) {
            const current = q.dequeue();
            order.push(current);

            for (const edge of this.neighbors(current)) {
                if (!visited.has(edge.target)) {
                    visited.add(edge.target);
                    q.enqueue(edge.target);
                }
            }
        }
        return order;
    }

    /** Find all paths from `start` to `end` (DFS) */
    allPaths(start, end, path = [], paths = []) {
        path.push(start);
        if (start === end) {
            paths.push([...path]);
        } else {
            for (const edge of this.neighbors(start)) {
                if (!path.includes(edge.target)) {
                    this.allPaths(edge.target, end, path, paths);
                }
            }
        }
        path.pop();
        return paths;
    }

    /** Shortest path using the Queue (BFS) */
    shortestPath(start, end) {
        const visited = new Set();
        const parent = new Map();
        const q = new Queue();

        q.enqueue(start);
        visited.add(start);

        while (!q.isEmpty()) {
            const current = q.dequeue();
            if (current === end) break;
            for (const edge of this.neighbors(current)) {
                if (!visited.has(edge.target)) {
                    visited.add(edge.target);
                    parent.set(edge.target, current);
                    q.enqueue(edge.target);
                }
            }
        }

        if (!visited.has(end)) return null;
        const result = [];
        let node = end;
        while (node !== undefined) {
            result.unshift(node);
            node = parent.get(node);
        }
        return result;
    }
}

/* =========================================================================
   BUILD THE WORKFLOW GRAPH
   ========================================================================= */

function buildWorkflowGraph() {
    const g = new Graph();

    // Nodes represent request statuses
    g.addNode("submitted", { label: "Submitted", color: "#4f46e5", description: "Request has been filed" });
    g.addNode("pending", { label: "Pending", color: "#f59e0b", description: "Awaiting staff review" });
    g.addNode("processing", { label: "Processing", color: "#2563eb", description: "Staff is preparing the document" });
    g.addNode("for_release", { label: "For Release", color: "#8b5cf6", description: "Ready for pickup / delivery" });
    g.addNode("completed", { label: "Completed", color: "#16a34a", description: "Document has been released" });
    g.addNode("rejected", { label: "Rejected", color: "#dc2626", description: "Request was denied" });
    g.addNode("cancelled", { label: "Cancelled", color: "#6b7280", description: "Request withdrawn by applicant" });

    // Edges represent valid transitions
    g.addEdge("submitted", "pending", "Staff receives");
    g.addEdge("pending", "processing", "Staff starts");
    g.addEdge("pending", "rejected", "Staff rejects");
    g.addEdge("pending", "cancelled", "Applicant cancels");
    g.addEdge("processing", "for_release", "Document ready");
    g.addEdge("processing", "rejected", "Verification fails");
    g.addEdge("for_release", "completed", "Released to applicant");
    g.addEdge("submitted", "cancelled", "Applicant cancels");

    return g;
}

/* =========================================================================
   SYNTHETIC DATA GENERATOR
   ========================================================================= */

const DOC_TYPES = [
    "Barangay Clearance", "Certificate of Indigency", "Certificate of Residency",
    "Business Permit", "Barangay ID", "Building Permit Certificate",
    "Certificate of Good Moral Character",
];

const FIRST_NAMES = [
    "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlos", "Elena",
    "Miguel", "Sofia", "Rafael", "Lucia", "Diego", "Carmen", "Manuel",
    "Teresa", "Roberto", "Patricia", "Fernando", "Beatriz",
];

const LAST_NAMES = [
    "Santos", "Reyes", "Cruz", "Garcia", "Ramos", "Rivera", "Torres",
    "Flores", "Gonzalez", "Lopez", "Martinez", "Hernandez", "Perez",
    "Rodriguez", "De Leon", "Villanueva", "Bautista", "Aquino",
];

const STATUSES = ["submitted", "pending", "processing", "for_release", "completed", "rejected", "cancelled"];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randomInt(0, arr.length - 1)]; }

function generateSyntheticRequests(count = 50) {
    const now = Date.now();
    const requests = [];

    for (let i = 0; i < count; i++) {
        const status = pick(STATUSES);
        const createdMs = now - randomInt(1, 30) * 86400000 - randomInt(0, 86400000);
        const created = new Date(createdMs);

        requests.push({
            id: `REQ-${String(1000 + i).padStart(5, "0")}`,
            applicant: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
            documentType: pick(DOC_TYPES),
            status,
            priority: pick(["normal", "normal", "normal", "urgent"]),
            created_at: created.toISOString(),
            updated_at: new Date(createdMs + randomInt(0, 5) * 3600000).toISOString(),
            processing_time_hrs: status === "completed" ? randomInt(2, 72) : null,
        });
    }

    return requests.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

/* =========================================================================
   SVG GRAPH VISUALISATION (canvas-like render with SVG)
   ========================================================================= */

const NODE_POSITIONS = {
    submitted: { x: 100, y: 200 },
    pending: { x: 280, y: 200 },
    processing: { x: 460, y: 200 },
    for_release: { x: 640, y: 200 },
    completed: { x: 820, y: 200 },
    rejected: { x: 460, y: 360 },
    cancelled: { x: 180, y: 360 },
};

function WorkflowGraphSVG({ graph, highlightPath }) {
    const highlightSet = new Set(highlightPath || []);
    const highlightEdge = new Set();
    if (highlightPath) {
        for (let i = 0; i < highlightPath.length - 1; i++) {
            highlightEdge.add(`${highlightPath[i]}→${highlightPath[i + 1]}`);
        }
    }

    const edges = [];
    for (const node of graph.nodes) {
        for (const edge of graph.neighbors(node)) {
            edges.push({ from: node, to: edge.target, label: edge.label });
        }
    }

    return (
        <svg viewBox="0 0 940 440" className="workflow-svg" aria-label="Workflow state graph">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <marker id="arrowhead-hl" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#4f46e5" />
                </marker>
                <filter id="glow">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
                </filter>
            </defs>

            {/* Edges */}
            {edges.map(({ from, to, label }) => {
                const a = NODE_POSITIONS[from];
                const b = NODE_POSITIONS[to];
                const key = `${from}→${to}`;
                const lit = highlightEdge.has(key);

                // Calculate curve offset for better visibility
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2 - (a.y === b.y ? 0 : 20);

                return (
                    <g key={key}>
                        <path
                            d={`M${a.x},${a.y} Q${mx},${my - 30} ${b.x},${b.y}`}
                            fill="none"
                            stroke={lit ? "#4f46e5" : "#cbd5e1"}
                            strokeWidth={lit ? 2.5 : 1.5}
                            markerEnd={lit ? "url(#arrowhead-hl)" : "url(#arrowhead)"}
                            className={lit ? "edge-highlight" : ""}
                        />
                        <text
                            x={mx}
                            y={my - 36}
                            textAnchor="middle"
                            className="edge-label"
                            fill={lit ? "#4f46e5" : "#94a3b8"}
                        >
                            {label}
                        </text>
                    </g>
                );
            })}

            {/* Nodes */}
            {graph.nodes.map((nodeId) => {
                const pos = NODE_POSITIONS[nodeId];
                const data = graph.nodeData.get(nodeId);
                const lit = highlightSet.has(nodeId);

                return (
                    <g key={nodeId} className={`graph-node ${lit ? "node-highlight" : ""}`}>
                        <rect
                            x={pos.x - 55}
                            y={pos.y - 28}
                            width={110}
                            height={56}
                            rx={12}
                            fill={lit ? data.color : "#1e293b"}
                            stroke={data.color}
                            strokeWidth={lit ? 3 : 1.5}
                            filter="url(#glow)"
                        />
                        <text
                            x={pos.x}
                            y={pos.y + 5}
                            textAnchor="middle"
                            fill={lit ? "#fff" : data.color}
                            className="node-label"
                        >
                            {data.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

/* =========================================================================
   PROCESSING QUEUE PANEL
   ========================================================================= */

function ProcessingQueuePanel({ requests }) {
    const [queue] = useState(() => {
        const q = new Queue();
        const pending = requests
            .filter((r) => r.status === "pending" || r.status === "submitted")
            .sort((a, b) => {
                if (a.priority === "urgent" && b.priority !== "urgent") return -1;
                if (b.priority === "urgent" && a.priority !== "urgent") return 1;
                return new Date(a.created_at) - new Date(b.created_at);
            });
        pending.forEach((r) => q.enqueue(r));
        return q;
    });

    const [processed, setProcessed] = useState([]);
    const [current, setCurrent] = useState(null);

    const processNext = () => {
        if (queue.isEmpty()) return;
        const next = queue.dequeue();
        setCurrent(next);
        setProcessed((prev) => [next, ...prev]);
        // Force re-render by updating state
        setTimeout(() => setCurrent(null), 1500);
    };

    const remaining = queue.toArray();

    return (
        <div className="queue-panel">
            <div className="queue-header">
                <div>
                    <span className="section-label">QUEUE DATA STRUCTURE</span>
                    <h3>Request Processing Queue</h3>
                    <p>FIFO queue prioritised by urgency, then submission time. Click "Process Next" to dequeue.</p>
                </div>

                <button
                    type="button"
                    className="btn-process-next"
                    onClick={processNext}
                    disabled={queue.isEmpty()}
                >
                    <i className="bi bi-play-fill" aria-hidden="true" />
                    Process Next ({queue.size} in queue)
                </button>
            </div>

            {current && (
                <div className="queue-current">
                    <span className="current-badge">NOW PROCESSING</span>
                    <strong>{current.id}</strong> — {current.applicant} — {current.documentType}
                    {current.priority === "urgent" && <span className="badge-urgent">URGENT</span>}
                </div>
            )}

            <div className="queue-lists">
                <div className="queue-list">
                    <h4>
                        <i className="bi bi-hourglass-split" aria-hidden="true" /> Waiting ({remaining.length})
                    </h4>
                    {remaining.length === 0 ? (
                        <p className="queue-empty">Queue is empty — all requests processed!</p>
                    ) : (
                        <ul>
                            {remaining.slice(0, 10).map((r, i) => (
                                <li key={r.id} className={r.priority === "urgent" ? "urgent" : ""}>
                                    <span className="queue-pos">{i + 1}</span>
                                    <div>
                                        <strong>{r.id}</strong>
                                        <span>{r.applicant}</span>
                                        <span className="queue-doc">{r.documentType}</span>
                                    </div>
                                    {r.priority === "urgent" && <span className="badge-urgent">URGENT</span>}
                                </li>
                            ))}
                            {remaining.length > 10 && (
                                <li className="queue-more">+ {remaining.length - 10} more in queue</li>
                            )}
                        </ul>
                    )}
                </div>

                <div className="queue-list processed">
                    <h4>
                        <i className="bi bi-check-circle" aria-hidden="true" /> Recently Dequeued ({processed.length})
                    </h4>
                    {processed.length === 0 ? (
                        <p className="queue-empty">No requests dequeued yet.</p>
                    ) : (
                        <ul>
                            {processed.slice(0, 8).map((r) => (
                                <li key={r.id}>
                                    <span className="queue-pos">✓</span>
                                    <div>
                                        <strong>{r.id}</strong>
                                        <span>{r.applicant}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   STATISTICS PANEL
   ========================================================================= */

function StatsPanel({ requests, graph }) {
    const statusCounts = {};
    for (const r of requests) {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    const completedTimes = requests
        .filter((r) => r.processing_time_hrs !== null)
        .map((r) => r.processing_time_hrs);

    const avgTime = completedTimes.length
        ? (completedTimes.reduce((a, b) => a + b, 0) / completedTimes.length).toFixed(1)
        : "—";

    const urgentCount = requests.filter((r) => r.priority === "urgent").length;

    // BFS traversal order from the graph
    const bfsOrder = graph.bfs("submitted");

    // All paths from submitted to completed
    const allPaths = graph.allPaths("submitted", "completed");

    // Shortest path
    const shortest = graph.shortestPath("submitted", "completed");

    return (
        <div className="stats-panel">
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-label">TOTAL REQUESTS</span>
                    <strong>{requests.length}</strong>
                </div>
                <div className="stat-card accent">
                    <span className="stat-label">URGENT</span>
                    <strong>{urgentCount}</strong>
                </div>
                <div className="stat-card success">
                    <span className="stat-label">COMPLETED</span>
                    <strong>{statusCounts.completed || 0}</strong>
                </div>
                <div className="stat-card warn">
                    <span className="stat-label">AVG TIME (HRS)</span>
                    <strong>{avgTime}</strong>
                </div>
                <div className="stat-card info">
                    <span className="stat-label">GRAPH NODES</span>
                    <strong>{graph.nodes.length}</strong>
                </div>
                <div className="stat-card info">
                    <span className="stat-label">POSSIBLE PATHS</span>
                    <strong>{allPaths.length}</strong>
                </div>
            </div>

            <div className="stats-detail-grid">
                <div className="stats-detail-card">
                    <h4><i className="bi bi-signpost-split" aria-hidden="true" /> BFS Traversal Order</h4>
                    <div className="path-chain">
                        {bfsOrder.map((nodeId, i) => (
                            <span key={nodeId}>
                                <span className="path-node" style={{ "--node-color": graph.nodeData.get(nodeId)?.color }}>
                                    {graph.nodeData.get(nodeId)?.label}
                                </span>
                                {i < bfsOrder.length - 1 && <span className="path-arrow">→</span>}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="stats-detail-card">
                    <h4><i className="bi bi-lightning" aria-hidden="true" /> Shortest Path (Submitted → Completed)</h4>
                    {shortest ? (
                        <div className="path-chain highlight">
                            {shortest.map((nodeId, i) => (
                                <span key={nodeId}>
                                    <span className="path-node" style={{ "--node-color": graph.nodeData.get(nodeId)?.color }}>
                                        {graph.nodeData.get(nodeId)?.label}
                                    </span>
                                    {i < shortest.length - 1 && <span className="path-arrow">→</span>}
                                </span>
                            ))}
                            <span className="path-length">{shortest.length} steps</span>
                        </div>
                    ) : (
                        <p>No path found.</p>
                    )}
                </div>

                <div className="stats-detail-card">
                    <h4><i className="bi bi-list-ol" aria-hidden="true" /> All Paths to Completion ({allPaths.length})</h4>
                    <div className="all-paths">
                        {allPaths.map((path, idx) => (
                            <div key={idx} className="path-chain small">
                                {path.map((nodeId, i) => (
                                    <span key={nodeId}>
                                        <span className="path-node small" style={{ "--node-color": graph.nodeData.get(nodeId)?.color }}>
                                            {graph.nodeData.get(nodeId)?.label}
                                        </span>
                                        {i < path.length - 1 && <span className="path-arrow">→</span>}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Per-status breakdown */}
            <div className="status-breakdown">
                <h4>Status Distribution</h4>
                <div className="status-bars">
                    {STATUSES.map((s) => {
                        const nodeData = graph.nodeData.get(s);
                        const cnt = statusCounts[s] || 0;
                        const pct = requests.length ? ((cnt / requests.length) * 100).toFixed(1) : 0;
                        return (
                            <div key={s} className="status-bar-row">
                                <span className="status-bar-label" style={{ color: nodeData?.color }}>
                                    {nodeData?.label || s}
                                </span>
                                <div className="status-bar-track">
                                    <div
                                        className="status-bar-fill"
                                        style={{ width: `${pct}%`, backgroundColor: nodeData?.color }}
                                    />
                                </div>
                                <span className="status-bar-value">{cnt} ({pct}%)</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   MAIN PAGE COMPONENT
   ========================================================================= */

export default function WorkflowAnalysis() {
    const [graph] = useState(() => buildWorkflowGraph());
    const [requests] = useState(() => generateSyntheticRequests(60));

    // Highlight path on the graph
    const shortestPath = graph.shortestPath("submitted", "completed");
    const [highlightPath, setHighlightPath] = useState(shortestPath);
    const [activeTab, setActiveTab] = useState("graph");

    const allPaths = graph.allPaths("submitted", "completed");

    return (
        <AdminLayout>
            <div className="workflow-analysis-page">
                <div className="container-fluid">
                    {/* Header */}
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">DATA STRUCTURES</span>
                            <h1>Workflow Analysis</h1>
                            <p>
                                Visualise the barangay document request lifecycle using <strong>Queue</strong> and <strong>Graph</strong> data
                                structures with synthetic request data.
                            </p>
                        </div>
                        <div className="wa-badge-row">
                            <span className="wa-badge"><i className="bi bi-diagram-3" aria-hidden="true" /> Graph (Adjacency List)</span>
                            <span className="wa-badge"><i className="bi bi-collection" aria-hidden="true" /> Queue (FIFO)</span>
                            <span className="wa-badge"><i className="bi bi-database" aria-hidden="true" /> {requests.length} Synthetic Records</span>
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="wa-tabs">
                        {[
                            { key: "graph", label: "Workflow Graph", icon: "bi-diagram-3" },
                            { key: "queue", label: "Processing Queue", icon: "bi-collection" },
                            { key: "stats", label: "Statistics", icon: "bi-bar-chart-line" },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`wa-tab ${activeTab === tab.key ? "active" : ""}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <i className={`bi ${tab.icon}`} aria-hidden="true" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Graph view */}
                    {activeTab === "graph" && (
                        <section className="dashboard-section wa-graph-section">
                            <div className="wa-section-header">
                                <div>
                                    <span className="section-label">GRAPH DATA STRUCTURE</span>
                                    <h2>Request Lifecycle State Machine</h2>
                                    <p>
                                        Each node is a status; edges are valid transitions.
                                        Select a path below to highlight it on the graph.
                                    </p>
                                </div>
                            </div>

                            <div className="wa-graph-container">
                                <WorkflowGraphSVG graph={graph} highlightPath={highlightPath} />
                            </div>

                            <div className="wa-path-selector">
                                <h4>Highlight a Path:</h4>
                                <div className="wa-path-buttons">
                                    <button
                                        type="button"
                                        className={`wa-path-btn ${highlightPath === shortestPath ? "active" : ""}`}
                                        onClick={() => setHighlightPath(shortestPath)}
                                    >
                                        Shortest (BFS)
                                    </button>
                                    {allPaths.map((path, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`wa-path-btn ${highlightPath === path ? "active" : ""}`}
                                            onClick={() => setHighlightPath(path)}
                                        >
                                            Path {idx + 1} ({path.length} steps)
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className="wa-path-btn"
                                        onClick={() => setHighlightPath(null)}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Adjacency list */}
                            <div className="wa-adjacency">
                                <h4>Adjacency List Representation</h4>
                                <div className="adjacency-table">
                                    {graph.nodes.map((nodeId) => {
                                        const data = graph.nodeData.get(nodeId);
                                        const neighbors = graph.neighbors(nodeId);
                                        return (
                                            <div key={nodeId} className="adj-row">
                                                <span className="adj-node" style={{ "--node-color": data.color }}>
                                                    {data.label}
                                                </span>
                                                <span className="adj-arrow">→</span>
                                                <span className="adj-targets">
                                                    {neighbors.length === 0 ? (
                                                        <span className="adj-empty">∅ (terminal)</span>
                                                    ) : (
                                                        neighbors.map((e, i) => (
                                                            <span key={e.target} className="adj-target">
                                                                {graph.nodeData.get(e.target)?.label}
                                                                <span className="adj-edge-label">({e.label})</span>
                                                                {i < neighbors.length - 1 && ", "}
                                                            </span>
                                                        ))
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Queue view */}
                    {activeTab === "queue" && (
                        <section className="dashboard-section">
                            <ProcessingQueuePanel requests={requests} />
                        </section>
                    )}

                    {/* Stats view */}
                    {activeTab === "stats" && (
                        <section className="dashboard-section">
                            <StatsPanel requests={requests} graph={graph} />
                        </section>
                    )}

                    {/* Synthetic data table */}
                    <section className="dashboard-section wa-data-section">
                        <div className="wa-section-header">
                            <div>
                                <span className="section-label">SYNTHETIC DATA</span>
                                <h2>Generated Request Records</h2>
                                <p>All {requests.length} synthetic records used in this analysis.</p>
                            </div>
                        </div>

                        <div className="admin-table-wrapper table-scroll">
                            <table className="admin-table data-table wa-data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Applicant</th>
                                        <th>Document Type</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Created</th>
                                        <th>Processing (hrs)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((r) => {
                                        const nodeData = graph.nodeData.get(r.status);
                                        return (
                                            <tr key={r.id}>
                                                <td><code>{r.id}</code></td>
                                                <td>{r.applicant}</td>
                                                <td>{r.documentType}</td>
                                                <td>
                                                    <span
                                                        className="wa-status-badge"
                                                        style={{ "--status-color": nodeData?.color || "#6b7280" }}
                                                    >
                                                        {nodeData?.label || r.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {r.priority === "urgent" ? (
                                                        <span className="badge-urgent">URGENT</span>
                                                    ) : (
                                                        "Normal"
                                                    )}
                                                </td>
                                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                                <td>{r.processing_time_hrs ?? "—"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
