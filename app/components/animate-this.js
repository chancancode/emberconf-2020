import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import d3 from 'd3';

export default class AnimateThisComponent extends Component {
  width = 960;
  height = 500;

  constructor(...args) {
    super(...args);

    let nodes = this.nodes = [];
    let colors = d3.scale.category10();

    for (let i=0; i<200; i++) {
      let color = colors(i % 3);

      if (i === 0) {
        nodes.push(new Node(0, color, true));
      } else {
        nodes.push(new Node(Math.random() * 12 + 4, color));
      }
    }

    this.root = nodes[0];
    this.children = nodes.slice(1);
    this.force = d3.layout.force()
      .gravity(0.05)
      .charge((d, i) => i ? 0 : -2000)
      .nodes(nodes)
      .size([this.width, this.height])
      .on("tick", this.onTick)
      .start();
  }

  @action
  onTick() {
    let q = d3.geom.quadtree(this.nodes);

    this.children.forEach(node => {
      q.visit(node.collide());
    });
  }

  @action
  onMouseMove(event) {
    let { left, top } = event.target.getBoundingClientRect();
    this.root.px = event.clientX - left;
    this.root.py = event.clientY - top;
    this.force.resume();
  }

  willDestroy() {
    this.force.stop().on("tick", null);
  }
}

class Node {
  @tracked x = 0;
  @tracked y = 0;

  constructor(radius, color, fixed = false) {
    this.radius = radius;
    this.color = color;
    this.fixed = fixed;
  }

  collide() {
    let r = this.radius + 16;
    let nx1 = this.x - r;
    let nx2 = this.x + r;
    let ny1 = this.y - r;
    let ny2 = this.y + r;

    return (quad, x1, y1, x2, y2) => {
      if (quad.point && (quad.point !== this)) {
        let x = this.x - quad.point.x;
        let y = this.y - quad.point.y;
        let l = Math.sqrt(x * x + y * y);
        let r = this.radius + quad.point.radius;

        if (l < r) {
          l = (l - r) / l * .5;
          this.x -= x *= l;
          this.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }

      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    }
  }
}
