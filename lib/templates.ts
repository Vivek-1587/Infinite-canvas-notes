import { DEFAULT_SETTINGS, NOTE_COLORS } from "@/lib/constants";
import type {
  Connection,
  Note,
  NoteGroup,
  TemplateDefinition,
  Workspace
} from "@/lib/types";

type TemplateNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt"> & {
  id: string;
};

const now = 1_735_689_600_000;

function note(input: TemplateNoteInput): Note {
  return {
    ...input,
    createdAt: now,
    updatedAt: now
  };
}

function connection(input: Connection): Connection {
  return input;
}

const projectGroups: NoteGroup[] = [
  { id: "group_discovery", name: "Discovery", color: "#38bdf8", createdAt: now },
  { id: "group_delivery", name: "Delivery", color: "#34d399", createdAt: now }
];

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "mind-map",
    name: "Mind Map",
    description: "A radial idea map for brainstorming and synthesis.",
    workspace: {
      groups: [],
      notes: [
        note({
          id: "mind_center",
          title: "Central Idea",
          content:
            "# Central Idea\n\nCapture the topic, decision, or question at the center of the canvas.",
          x: 0,
          y: 0,
          color: NOTE_COLORS[2],
          tags: ["mind-map"]
        }),
        note({
          id: "mind_branch_1",
          title: "Audience",
          content: "## Audience\n\nWho is this for, and what do they need to understand?",
          x: -440,
          y: -220,
          color: NOTE_COLORS[0],
          tags: ["mind-map", "context"]
        }),
        note({
          id: "mind_branch_2",
          title: "Constraints",
          content:
            "## Constraints\n\nBudget, schedule, dependencies, risks, and non-goals.",
          x: 430,
          y: -230,
          color: NOTE_COLORS[4],
          tags: ["mind-map", "risk"]
        }),
        note({
          id: "mind_branch_3",
          title: "Opportunities",
          content:
            "## Opportunities\n\nIdeas worth testing, compounding advantages, and open questions.",
          x: -360,
          y: 300,
          color: NOTE_COLORS[1],
          tags: ["mind-map", "ideas"]
        }),
        note({
          id: "mind_branch_4",
          title: "Next Actions",
          content:
            "## Next Actions\n\n- [ ] Pick one thread\n- [ ] Convert it into a plan\n- [ ] Share the canvas",
          x: 420,
          y: 290,
          color: NOTE_COLORS[5],
          tags: ["mind-map", "action"]
        })
      ],
      connections: [
        connection({
          id: "mind_c_1",
          sourceId: "mind_center",
          targetId: "mind_branch_1",
          label: "frames",
          type: "related"
        }),
        connection({
          id: "mind_c_2",
          sourceId: "mind_center",
          targetId: "mind_branch_2",
          label: "bounded by",
          type: "causes"
        }),
        connection({
          id: "mind_c_3",
          sourceId: "mind_center",
          targetId: "mind_branch_3",
          label: "opens",
          type: "supports"
        }),
        connection({
          id: "mind_c_4",
          sourceId: "mind_branch_3",
          targetId: "mind_branch_4",
          label: "feeds",
          type: "supports"
        })
      ]
    }
  },
  {
    id: "project-planning",
    name: "Project Planning",
    description: "A delivery map for goals, milestones, risks, and decisions.",
    workspace: {
      groups: projectGroups,
      notes: [
        note({
          id: "project_goal",
          title: "Project Goal",
          content:
            "# Project Goal\n\nDefine the outcome in one sentence, then list the signals that prove it worked.",
          x: -260,
          y: -120,
          color: NOTE_COLORS[2],
          tags: ["project", "strategy"],
          groupId: "group_discovery"
        }),
        note({
          id: "project_scope",
          title: "Scope",
          content:
            "## Scope\n\n**In:** core workflows, data model, launch criteria.\n\n**Out:** work that does not change the launch decision.",
          x: 120,
          y: -120,
          color: NOTE_COLORS[0],
          tags: ["project"],
          groupId: "group_discovery"
        }),
        note({
          id: "project_milestones",
          title: "Milestones",
          content:
            "## Milestones\n\n- [ ] Prototype\n- [ ] Internal review\n- [ ] Beta\n- [ ] Production launch",
          x: 510,
          y: -120,
          color: NOTE_COLORS[5],
          tags: ["project", "delivery"],
          groupId: "group_delivery"
        }),
        note({
          id: "project_risks",
          title: "Risks",
          content:
            "## Risks\n\n| Risk | Mitigation |\n| --- | --- |\n| Ambiguous scope | Decision log |\n| Late feedback | Weekly review |",
          x: 120,
          y: 190,
          color: NOTE_COLORS[4],
          tags: ["project", "risk"],
          groupId: "group_discovery"
        }),
        note({
          id: "project_decisions",
          title: "Decision Log",
          content:
            "## Decision Log\n\n> Record important choices with context, owner, and date.",
          x: 510,
          y: 190,
          color: NOTE_COLORS[3],
          tags: ["project", "decisions"],
          groupId: "group_delivery"
        })
      ],
      connections: [
        connection({
          id: "project_c_1",
          sourceId: "project_goal",
          targetId: "project_scope",
          label: "defines",
          type: "causes"
        }),
        connection({
          id: "project_c_2",
          sourceId: "project_scope",
          targetId: "project_milestones",
          label: "drives",
          type: "supports"
        }),
        connection({
          id: "project_c_3",
          sourceId: "project_risks",
          targetId: "project_decisions",
          label: "requires",
          type: "references"
        })
      ]
    }
  },
  {
    id: "zettelkasten",
    name: "Zettelkasten",
    description: "Atomic notes linked by claims, references, and synthesis.",
    workspace: {
      groups: [],
      notes: [
        note({
          id: "zettel_source",
          title: "Source Note",
          content:
            "# Source Note\n\nBibliographic details, key excerpts, and page references live here.",
          x: -360,
          y: 0,
          color: NOTE_COLORS[6],
          tags: ["source", "zettel"]
        }),
        note({
          id: "zettel_claim",
          title: "Atomic Claim",
          content:
            "# Atomic Claim\n\nA single durable idea written in your own words.\n\n`One note, one idea.`",
          x: 10,
          y: -150,
          color: NOTE_COLORS[1],
          tags: ["claim", "zettel"]
        }),
        note({
          id: "zettel_context",
          title: "Context",
          content:
            "# Context\n\nWhere this claim applies, where it breaks down, and what it depends on.",
          x: 400,
          y: 0,
          color: NOTE_COLORS[2],
          tags: ["context", "zettel"]
        }),
        note({
          id: "zettel_synthesis",
          title: "Synthesis",
          content:
            "# Synthesis\n\nCombine linked notes into a higher-level argument or essay outline.",
          x: 10,
          y: 240,
          color: NOTE_COLORS[3],
          tags: ["synthesis", "zettel"]
        })
      ],
      connections: [
        connection({
          id: "zettel_c_1",
          sourceId: "zettel_source",
          targetId: "zettel_claim",
          label: "references",
          type: "references"
        }),
        connection({
          id: "zettel_c_2",
          sourceId: "zettel_claim",
          targetId: "zettel_context",
          label: "qualified by",
          type: "related"
        }),
        connection({
          id: "zettel_c_3",
          sourceId: "zettel_claim",
          targetId: "zettel_synthesis",
          label: "supports",
          type: "supports"
        })
      ]
    }
  },
  {
    id: "research-notes",
    name: "Research Notes",
    description: "A structured canvas for questions, evidence, and insights.",
    workspace: {
      groups: [],
      notes: [
        note({
          id: "research_question",
          title: "Research Question",
          content: "# Research Question\n\nWhat decision will this research change?",
          x: -280,
          y: -140,
          color: NOTE_COLORS[2],
          tags: ["research", "question"]
        }),
        note({
          id: "research_methods",
          title: "Methods",
          content:
            "## Methods\n\n- Interviews\n- Desk research\n- Competitive scan\n- Usage review",
          x: 110,
          y: -140,
          color: NOTE_COLORS[5],
          tags: ["research", "method"]
        }),
        note({
          id: "research_evidence",
          title: "Evidence",
          content:
            "## Evidence\n\nUse tables, links, images, and excerpts to keep raw material close to the canvas.",
          x: -280,
          y: 170,
          color: NOTE_COLORS[0],
          tags: ["research", "evidence"]
        }),
        note({
          id: "research_insight",
          title: "Insight",
          content:
            "## Insight\n\n> Turn evidence into a claim that can guide product or strategy.",
          x: 110,
          y: 170,
          color: NOTE_COLORS[1],
          tags: ["research", "insight"]
        })
      ],
      connections: [
        connection({
          id: "research_c_1",
          sourceId: "research_question",
          targetId: "research_methods",
          label: "chooses",
          type: "causes"
        }),
        connection({
          id: "research_c_2",
          sourceId: "research_methods",
          targetId: "research_evidence",
          label: "collects",
          type: "references"
        }),
        connection({
          id: "research_c_3",
          sourceId: "research_evidence",
          targetId: "research_insight",
          label: "supports",
          type: "supports"
        })
      ]
    }
  }
];

export function buildStarterWorkspace(): Workspace {
  const template = TEMPLATES[0];

  return {
    notes: template.workspace.notes,
    connections: template.workspace.connections,
    groups: template.workspace.groups,
    settings: DEFAULT_SETTINGS
  };
}

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
