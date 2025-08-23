export interface ParentRequirement {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface ChildRequirement {
  id: number;
  parent_requirement_id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface TestRun {
  id: number;
  child_requirement_id: number;
  name: string;
  status: 'passed' | 'failed' | 'pending';
  description?: string;
  created_at: string;
}

export interface BubbleNode {
  id: string;
  type: 'parent' | 'child' | 'test';
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  data: ParentRequirement | ChildRequirement | TestRun;
  vx?: number;
  vy?: number;
  targetX?: number;
  targetY?: number;
  parentId?: string;
}

export interface TraceLine {
  from: string;
  to: string;
  color: string;
}