# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Instructions

### Prompt Logging Requirement

**YOU MUST ALWAYS save every prompt you receive in the `prompts.md` file.**

This is a project-specific requirement defined in the original CLAUDE.md. Append new prompts with timestamps to maintain a complete history.

## Project Overview

**Smart Budget App** - A budgeting application being developed using the BMad Method (BMM) for AI-powered agile development.

This is an early-stage project initialized with BMM infrastructure but no application code yet. The project uses a structured, agent-driven development workflow with specialized AI agents guiding each phase of development.

## BMad Method Framework

This project uses the **BMad Method Module (BMM)**, an AI-driven agile development system located in `.bmad/bmm/`. The framework provides:

- **12 specialized AI agents** for different development roles (PM, Architect, Dev, TEA, etc.)
- **34 workflows across 4 phases** (Analysis, Planning, Solutioning, Implementation)
- **Scale-adaptive planning** that adjusts to project complexity (Levels 0-4)
- **Story-centric implementation** with lifecycle tracking

### Key BMM Agents

Access agents via slash commands in supported IDEs:
- `/bmad:bmm:agents:pm` - Product Manager
- `/bmad:bmm:agents:architect` - Software Architect
- `/bmad:bmm:agents:dev` - Developer
- `/bmad:bmm:agents:tea` - Test Engineer/Architect
- `/bmad:bmm:agents:analyst` - Business Analyst
- `/bmad:bmm:agents:sm` - Scrum Master
- `/bmad:bmm:agents:ux-designer` - UX Designer
- `/bmad:bmm:agents:tech-writer` - Technical Writer

### Essential Workflows

Initialize and manage the project:
- `/bmad:bmm:workflows:workflow-init` - Initialize new BMM project (determines level, type, creates workflow path)
- `/bmad:bmm:workflows:workflow-status` - Check current status ("what should I do now?")
- `/bmad:bmm:workflows:product-brief` - Create product vision and requirements
- `/bmad:bmm:workflows:prd` - Generate Product Requirements Document and epic breakdown
- `/bmad:bmm:workflows:architecture` - Create architectural decisions for AI-agent consistency
- `/bmad:bmm:workflows:create-story` - Generate next user story from epics/PRD
- `/bmad:bmm:workflows:dev-story` - Execute a story (implement, test, validate)
- `/bmad:bmm:workflows:code-review` - Senior developer review of completed story

### Project Status Tracking

The project tracks its progress in `docs/bmm-workflow-status.yaml`. This file contains:
- Current workflow phase and status
- Project type and selected track (Quick Flow, BMad Method, or Enterprise Method)
- Completion status of each workflow step

Check status with: `/bmad:bmm:workflows:workflow-status`

## Project Structure

```
Smart-Budget-App/
├── .bmad/              # BMad Method framework (DO NOT MODIFY)
│   ├── bmm/           # BMM module with agents, workflows, docs
│   ├── core/          # Core BMad infrastructure
│   └── _cfg/          # Configuration and customization
├── docs/              # Project documentation
│   └── bmm-workflow-status.yaml  # Current workflow state
├── CLAUDE.md          # This file
└── prompts.md         # Log of all prompts (MUST UPDATE)
```

### BMad Framework Files

**DO NOT modify files in `.bmad/` directory** - these are framework files managed by the BMM system. Customizations should go in `.bmad/_cfg/` if needed.

## Development Workflow

Since this is a new project with no application code yet:

1. **Start with workflow initialization** if not already done:
   ```
   /bmad:bmm:workflows:workflow-init
   ```

2. **Check current status** to understand what to do next:
   ```
   /bmad:bmm:workflows:workflow-status
   ```

3. **Follow BMM phase progression**:
   - **Phase 1 (Analysis)**: Product brief, research, domain exploration
   - **Phase 2 (Planning)**: PRD creation, epic breakdown
   - **Phase 3 (Solutioning)**: Architecture decisions (for Level 2-4 projects)
   - **Phase 4 (Implementation)**: Story-by-story development

4. **For quick features/fixes** (Level 0-1):
   ```
   /bmad:bmm:workflows:tech-spec
   ```

## Key Concepts

### Scale-Adaptive Tracks

BMM automatically recommends one of three tracks based on project complexity:

- **Quick Flow** (Level 0-1): Bug fixes, single features - uses tech-spec workflow
- **BMad Method** (Level 2): Medium projects - PRD with optional architecture
- **Enterprise Method** (Level 3-4): Complex projects - Full PRD + comprehensive architecture

### Story Lifecycle

Stories progress through defined states:
```
backlog → drafted → ready → in-progress → review → done
```

Use workflow commands to manage transitions:
- `/bmad:bmm:workflows:story-ready` - Mark story ready for development
- `/bmad:bmm:workflows:story-done` - Mark story complete

### Multi-Agent Collaboration

For complex decisions, brainstorming, or strategic planning:
```
/bmad:core:workflows:party-mode
```

This orchestrates group discussions between all installed agents.

## Documentation Resources

BMM provides extensive documentation in `.bmad/bmm/docs/`:
- `quick-start.md` - Getting started guide (15 min)
- `agents-guide.md` - Complete agent reference (45 min)
- `scale-adaptive-system.md` - Understanding project levels (42 min)
- `workflows-*.md` - Detailed workflow documentation by phase
- `faq.md` - Frequently asked questions
- `glossary.md` - Key terminology

## Current Project State

As of initialization:
- Git repository initialized with main branch
- BMM framework installed and configured
- No application code or tests yet
- Workflow status file created (template state)
- Ready for workflow-init to begin development process

## Next Steps for Development

1. Run `/bmad:bmm:workflows:workflow-init` to set project parameters
2. Complete Phase 1 analysis (product-brief recommended)
3. Generate PRD and epics in Phase 2
4. Create architecture decisions in Phase 3 (if Level 2+)
5. Begin story-based implementation in Phase 4