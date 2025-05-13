import { useMemo, useRef, useEffect } from "react"
import * as d3 from "d3"

interface BinaryTreeNode {
    address: string
    value: number
    left?: BinaryTreeNode
    right?: BinaryTreeNode
}

type GraphNode = { id: string; label: string }
type GraphEdge = { from: string, to: string }

function treesToGraph(trees: BinaryTreeNode[]) {
    const nodes: Record<string, GraphNode> = {}
    const edges: GraphEdge[] = []
    trees.forEach(tree => treeToGraphInternal(tree, nodes, edges))
    return { nodes: Object.values(nodes), edges }
}

function treeToGraphInternal(tree: BinaryTreeNode, nodes: Record<string, GraphNode>, edges: GraphEdge[]) {
    if (tree === null) {
        return
    }
    
    if (tree.address in nodes) {
        return
    }

    if (tree.left) {
        edges.push({ from: tree.address, to: tree.left.address })
    }

    if (tree.right) {
        edges.push({ from: tree.address, to: tree.right.address })
    }

    nodes[tree.address] = { id: tree.address, label: tree.value + '' }
    treeToGraphInternal(tree.left, nodes, edges)
    treeToGraphInternal(tree.right, nodes, edges)
}

export default function BinarySearchTree({ analysis, timePerStep, currentStepIndex}) {
    const steps = useMemo(() => analysis, [analysis])
    const step = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex])
    const graph = useMemo(() => treesToGraph(step.trees), [step.trees])
    const svgRef = useRef<SVGSVGElement | null>(null);

    console.log("step", steps)
    console.log('graph', graph)

    const width = svgRef.current?.scrollWidth ?? 800
    const height = svgRef.current?.scrollHeight ?? 400
    const duration = 0

    

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const treeWidth = width / step.trees.length;
    const treeLayout = d3.tree<BinaryTreeNode>().size([treeWidth - 40, height - 100]);

    step.trees.forEach((treeRoot, index) => {
      const root = d3.hierarchy(treeRoot, d => [d.left, d.right].filter(Boolean) as BinaryTreeNode[]);
      const treeData = treeLayout(root);

      const group = svg
        .append('g')
        .attr('transform', `translate(${index * treeWidth + 20}, 50)`);

      // Links
      const link = group
        .selectAll('.link')
        .data(treeData.links(), d => `${d.source.data.address}-${d.target.data.address}`);

      link.enter()
        .append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-width', 1.5)
        .attr('d', d3.linkVertical()
          .x(d => d.x)
          .y(d => d.y) as any)
        .attr('opacity', 0)
        .transition()
        .duration(duration)
        .attr('opacity', 1);

      // Nodes
      const node = group
        .selectAll('.node')
        .data(treeData.descendants(), d => d.data.address);

      const nodeEnter = node.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x}, ${d.y - 20})`)
        .attr('opacity', 0);

      nodeEnter.transition()
        .duration(duration)
        .attr('opacity', 1)
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

      nodeEnter.append('circle')
        .attr('r', 15)
        .attr('fill', '#69b3a2');

      nodeEnter.append('text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .text(d => d.data.value)
        .style('fill', 'white');
    });
  }, [step.trees, width, height]);

  return <svg ref={svgRef} className="w-full h-full" />;
}
