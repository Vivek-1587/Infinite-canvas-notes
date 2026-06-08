import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY
} from "d3-force";
import type { Connection, Note } from "@/lib/types";

export interface GraphLayoutNode {
  id: string;
  x: number;
  y: number;
  cluster: string;
}

interface SimulationNode extends GraphLayoutNode {
  index?: number;
  vx?: number;
  vy?: number;
}

export function computeForceLayout(
  notes: Note[],
  connections: Connection[],
  width = 1200,
  height = 800
): GraphLayoutNode[] {
  const nodes: SimulationNode[] = notes.map((note) => ({
    id: note.id,
    x: note.x / 2,
    y: note.y / 2,
    cluster: note.tags[0] ?? note.groupId ?? "untagged"
  }));

  const clusterOrder = Array.from(new Set(nodes.map((node) => node.cluster)));
  const clusterX = new Map(
    clusterOrder.map((cluster, index) => [
      cluster,
      ((index + 1) / (clusterOrder.length + 1)) * width - width / 2
    ])
  );
  const clusterY = new Map(
    clusterOrder.map((cluster, index) => [
      cluster,
      ((index % 3) - 1) * Math.min(180, height * 0.12)
    ])
  );

  const links = connections
    .filter(
      (connection) =>
        notes.some((note) => note.id === connection.sourceId) &&
        notes.some((note) => note.id === connection.targetId)
    )
    .map((connection) => ({
      source: connection.sourceId,
      target: connection.targetId
    }));

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink(links)
        .id((node) => (node as SimulationNode).id)
        .distance(170)
        .strength(0.36)
    )
    .force("charge", forceManyBody().strength(-520))
    .force("collide", forceCollide(96).strength(0.9))
    .force("center", forceCenter(0, 0))
    .force(
      "cluster-x",
      forceX((node) => clusterX.get((node as SimulationNode).cluster) ?? 0).strength(0.12)
    )
    .force(
      "cluster-y",
      forceY((node) => clusterY.get((node as SimulationNode).cluster) ?? 0).strength(
        0.045
      )
    )
    .stop();

  for (let i = 0; i < 180; i += 1) simulation.tick();

  return nodes.map((node) => ({
    id: node.id,
    x: Math.round(node.x ?? 0),
    y: Math.round(node.y ?? 0),
    cluster: node.cluster
  }));
}
