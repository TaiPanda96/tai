# Night Agent Github Yaml Spec

name: Night Agent (Multi-Agent)
on:
schedule: - cron: "0 3 \* \* \*" # 3 AM daily
workflow_dispatch:
inputs:
pr_number:
description: "PR number to implement (leave empty for auto-detect)"
required: false
type: string

jobs:
night-agent:
timeout-minutes: 55 # Planner(10) + Implementer(25) + QA(8) + overhead
permissions:
contents: write
pull-requests: write

    runs-on: ubuntu-latest

    services:
      redis:
        image: public.ecr.aws/docker/library/redis:7-alpine
        ports: ["6379:6379"]
      postgres:
        image: timescale/timescaledb:latest-pg15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: pgpass
          POSTGRES_DB: test
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    env:
      TZ: America/New_York
      DATABASE_URL: postgresql://postgres:pgpass@localhost:5432/test

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Derive Spec File
        run: |
          BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
          SPEC_ID=$(echo "$BRANCH_NAME" | sed 's|night-agent/||')
          SPEC_FILE=$(ls apps/risk-manager/docs/specs/${SPEC_ID}-*.md 2>/dev/null | head -1)
          echo "SPEC_FILE=$SPEC_FILE" >> $GITHUB_ENV
          echo "Spec: $SPEC_FILE"

      - name: Ensure labels exist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh label create "night-agent" \
            --color "5319E7" \
            --description "Queued for night agent implementation" 2>/dev/null || true
          gh label create "night-agent-complete" \
            --color "0E8A16" \
            --description "Night agent implementation complete" 2>/dev/null || true

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install Dependencies
        run: bun install

      - name: Install Claude CLI
        run: bun add -g @anthropic-ai/claude-code

      - name: Prisma Gen
        working-directory: apps/risk-manager
        run: bunx prisma generate

      - name: Configure Git Identity
        run: |
          git config --global user.name "Claude Night Agent"
          git config --global user.email ${{ secrets.NIGHT_AGENT_EMAIL }}

      - name: Setup Security Wrapper
        working-directory: apps/risk-manager
        run: chmod +x scripts/safe-bash.sh

      - name: Prepare Handoff Directory
        working-directory: apps/risk-manager
        run: mkdir -p tmp

      # ─────────────────────────────────────────────
      # STAGE 1: PLANNER AGENT
      # Reads the PR + spec + codebase, writes tmp/implementation-plan.md
      # ─────────────────────────────────────────────
      - name: "Stage 1: Planner Agent"
        working-directory: apps/risk-manager
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SHELL: ${{ github.workspace }}/apps/risk-manager/scripts/safe-bash.sh
          PR_NUMBER: ${{ github.event.inputs.pr_number || '' }}
        run: |
          echo "🧠 Starting Planner Agent (10 min budget)..."

          timeout 600s bash -c \
            'cat scripts/prompts/planner-agent-prompt.md | claude --dangerously-skip-permissions' || {
            echo "⚠️ Planner timed out or errored"
            # Check if a partial plan was written
            if [ -f tmp/implementation-plan.md ]; then
              echo "✅ Partial plan found — Implementer will use it"
              cat tmp/implementation-plan.md | head -30
            else
              echo "❌ No plan produced — pipeline cannot continue"
              exit 1
            fi
          }

          echo ""
          echo "📋 Planner output:"
          cat tmp/implementation-plan.md

      # ─────────────────────────────────────────────
      # LOAD PR CONTEXT
      # Picks up PR_NUMBER and BRANCH_NAME written by the Planner Agent.
      # These override the workflow-level inputs so that stages 2 and 3
      # always operate on the correct feature branch, never on main.
      # ─────────────────────────────────────────────
      - name: Load PR Context
        run: |
          if [ -f apps/risk-manager/tmp/pr-context.sh ]; then
            source apps/risk-manager/tmp/pr-context.sh
            if [ -z "$PR_NUMBER" ] || [ -z "$BRANCH_NAME" ]; then
              echo "❌ pr-context.sh exists but is missing PR_NUMBER or BRANCH_NAME"
              exit 1
            fi
            echo "PR_NUMBER=$PR_NUMBER" >> $GITHUB_ENV
            echo "BRANCH_NAME=$BRANCH_NAME" >> $GITHUB_ENV
            echo "✅ PR context loaded: PR #$PR_NUMBER on branch $BRANCH_NAME"
          else
            echo "❌ tmp/pr-context.sh not found — Planner Agent did not complete Step 0"
            exit 1
          fi

      # ─────────────────────────────────────────────
      # STAGE 2: IMPLEMENTER AGENT
      # Reads tmp/implementation-plan.md, writes code, commits
      # ─────────────────────────────────────────────
      - name: "Stage 2: Implementer Agent"
        working-directory: apps/risk-manager
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SHELL: ${{ github.workspace }}/apps/risk-manager/scripts/safe-bash.sh
          PR_NUMBER: ${{ env.PR_NUMBER }}
          BRANCH_NAME: ${{ env.BRANCH_NAME }}
        run: |
          echo "⚡ Starting Implementer Agent (25 min budget)..."

          COMMITS_BEFORE=$(git log --oneline HEAD ^origin/main 2>/dev/null | wc -l || echo "0")

          timeout 1500s bash -c \
            'cat scripts/prompts/implementer-agent-prompt.md | claude --dangerously-skip-permissions' || {
            echo "⚠️ Implementer timed out or errored"
          }

          COMMITS_AFTER=$(git log --oneline HEAD ^origin/main 2>/dev/null | wc -l || echo "0")
          NEW_COMMITS=$((COMMITS_AFTER - COMMITS_BEFORE))

          echo ""
          echo "📊 Implementer result: $NEW_COMMITS new commits"
          if [ "$NEW_COMMITS" -gt 0 ]; then
            git log --oneline HEAD ^origin/main --pretty=format:'  • %s' | head -10
          fi

          # Write a minimal handoff note if the implementer didn't write one
          if [ ! -f tmp/implementation-result.md ]; then
            echo "# Implementation Result" > tmp/implementation-result.md
            echo "" >> tmp/implementation-result.md
            echo "## Status" >> tmp/implementation-result.md
            echo "partial (no result file written by implementer)" >> tmp/implementation-result.md
            echo "" >> tmp/implementation-result.md
            echo "## Commits Made" >> tmp/implementation-result.md
            git log --oneline HEAD ^origin/main | head -10 >> tmp/implementation-result.md
            echo "" >> tmp/implementation-result.md
            echo "## Files Changed" >> tmp/implementation-result.md
            git diff --name-only origin/main >> tmp/implementation-result.md
          fi

      # ─────────────────────────────────────────────
      # STAGE 3: QA AGENT
      # Runs checks, reviews diff, posts PR comment, updates spec.
      # continue-on-error so post-processing always runs, but the step
      # outcome is preserved so Update Spec Status can gate on it.
      # ─────────────────────────────────────────────
      - name: "Stage 3: QA Agent"
        id: qa_agent
        continue-on-error: true
        working-directory: apps/risk-manager
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SHELL: ${{ github.workspace }}/apps/risk-manager/scripts/safe-bash.sh
          PR_NUMBER: ${{ env.PR_NUMBER }}
          BRANCH_NAME: ${{ env.BRANCH_NAME }}
          SPEC_FILE: ${{ env.SPEC_FILE }}
        run: |
          echo "🔍 Starting QA Agent (8 min budget)..."

          timeout 480s bash -c \
            'cat scripts/prompts/qa-agent-prompt.md | claude --dangerously-skip-permissions'
          echo "✅ QA Agent completed"

      # ─────────────────────────────────────────────
      # UPDATE SPEC STATUS
      # Only marks a spec "completed" when the QA agent actually finished
      # (steps.qa_agent.outcome == 'success') AND all quality checks pass.
      # A silent timeout leaves the spec as "in-progress" for the next run.
      # ─────────────────────────────────────────────
      - name: Update Spec Status
        if: always()
        working-directory: apps/risk-manager
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          QA_SIGNED_OFF: ${{ steps.qa_agent.outcome == 'success' }}
        run: |
          BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

          # Derive spec ID from branch: "night-agent/spec-001" → "spec-001"
          SPEC_ID=$(echo "$BRANCH_NAME" | sed 's|night-agent/||')
          SPEC_FILE=$(ls docs/specs/${SPEC_ID}-*.md 2>/dev/null | head -1)

          if [ -z "$SPEC_FILE" ]; then
            echo "No spec file found for $SPEC_ID — skipping status update"
            exit 0
          fi

          echo "📋 Spec file: $SPEC_FILE"

          # Require QA agent sign-off before marking completed.
          # A timeout or crash leaves the spec as in-progress for retry.
          if [ "$QA_SIGNED_OFF" != "true" ]; then
            echo "⚠️ QA agent did not complete — leaving spec as in-progress"
            exit 0
          fi

          # Determine status from quality check results
          QA_PASSED=true
          bun run typecheck 2>&1 || QA_PASSED=false
          bun run lint      2>&1 || QA_PASSED=false
          bun run test      2>&1 || QA_PASSED=false

          if [ "$QA_PASSED" = "true" ]; then
            NEW_STATUS="completed"
            echo "✅ All checks passed — marking $SPEC_ID as completed"
          else
            NEW_STATUS="blocked"
            echo "❌ Checks failed — marking $SPEC_ID as blocked"
          fi

          # Only write if status is still in-progress (agent may have already updated it)
          if grep -q '^status: in-progress' "$SPEC_FILE"; then
            sed -i "s/^status: in-progress/status: $NEW_STATUS/" "$SPEC_FILE"
            git add "$SPEC_FILE"
            git commit -m "chore: mark $SPEC_ID $NEW_STATUS" || true
            git push origin "$BRANCH_NAME"
          else
            echo "Status already updated by QA agent — no change needed"
          fi

      # ─────────────────────────────────────────────
      # POST-PROCESSING (always runs)
      # ─────────────────────────────────────────────
      - name: Auto-format Code
        if: always()
        working-directory: apps/risk-manager
        run: |
          bunx prettier --write .
          if ! git diff --quiet; then
            BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD)"
            if [ "$BRANCH_NAME" = "HEAD" ]; then
              echo "⚠️ Detached HEAD — skipping format commit"
            else
              git add -u
              git commit -m "style: auto-format with prettier" \
                -m "Co-Authored-By: Claude <noreply@anthropic.com>"
              git push origin "$BRANCH_NAME"
            fi
          fi

      - name: Verify Prettier
        if: always()
        working-directory: apps/risk-manager
        run: bunx prettier --check .

      - name: Pipeline Summary
        if: always()
        working-directory: apps/risk-manager
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          BRANCH_NAME=$(git branch --show-current)
          COMMITS_MADE=$(git log --oneline HEAD ^origin/main 2>/dev/null | wc -l || echo "0")

          echo "────────────────────────────────────────"
          echo "🌙 Night Agent Pipeline Complete"
          echo "────────────────────────────────────────"
          echo "Branch:  $BRANCH_NAME"
          echo "Commits: $COMMITS_MADE"
          echo ""

          if [ "$COMMITS_MADE" -gt 0 ]; then
            echo "Recent commits:"
            git log --oneline HEAD ^origin/main --pretty=format:'  • %s' | head -5
            echo ""
            EXISTING_PR=$(gh pr list --head "$BRANCH_NAME" --json number --jq '.[0].number' 2>/dev/null || echo "")
            if [ -n "$EXISTING_PR" ]; then
              echo "PR: https://github.com/$GITHUB_REPOSITORY/pull/$EXISTING_PR"
            fi
          else
            echo "No commits — no pending work found or pipeline was blocked"
          fi

          echo ""
          echo "Handoff files:"
          [ -f tmp/implementation-plan.md ] && echo "  ✅ tmp/implementation-plan.md" || echo "  ❌ tmp/implementation-plan.md (missing)"
          [ -f tmp/implementation-result.md ] && echo "  ✅ tmp/implementation-result.md" || echo "  ❌ tmp/implementation-result.md (missing)"
