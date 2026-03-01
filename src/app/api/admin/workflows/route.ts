import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';

export const dynamic = 'force-dynamic';

type WorkflowRole = 'detect' | 'verify' | 'localize' | 'benchmark';

interface WorkflowSourceMappingInput {
  source_id: string;
  role: WorkflowRole;
  priority: number;
  is_required: boolean;
}

interface WorkflowRecord {
  id: string;
  workflow_code: string;
  workflow_name: string;
  content_type: string;
  digest_edition: string | null;
  article_tag: string | null;
  objective: string | null;
  output_contract: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkflowMappingRecord {
  workflow_id: string;
  source_id: string;
  role: WorkflowRole;
  priority: number;
  is_required: boolean;
  source?: {
    id: string;
    name: string;
    domain: string | null;
    entity_kind: string | null;
    locale: string | null;
    credibility_score: number | null;
    is_active: boolean | null;
  } | null;
}

interface RawWorkflowMappingRecord {
  workflow_id: string;
  source_id: string;
  role: WorkflowRole;
  priority: number;
  is_required: boolean;
  source?: {
    id: string;
    name: string;
    domain: string | null;
    entity_kind: string | null;
    locale: string | null;
    credibility_score: number | null;
    is_active: boolean | null;
  }[] | {
    id: string;
    name: string;
    domain: string | null;
    entity_kind: string | null;
    locale: string | null;
    credibility_score: number | null;
    is_active: boolean | null;
  } | null;
}

export async function GET() {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      workflows: [],
      note: 'Database credentials are not configured.',
    });
  }

  try {
    const [{ data: workflows, error: workflowError }, { data: mappings, error: mappingError }] =
      await Promise.all([
        supabase
          .from('content_workflows')
          .select('*')
          .order('content_type', { ascending: true })
          .order('workflow_name', { ascending: true }),
        supabase
          .from('workflow_source_mappings')
          .select(`
            workflow_id,
            source_id,
            role,
            priority,
            is_required,
            source:sources (
              id,
              name,
              domain,
              entity_kind,
              locale,
              credibility_score,
              is_active
            )
          `)
          .order('priority', { ascending: false }),
      ]);

    if (workflowError) {
      console.error('[admin/workflows] Workflow query failed:', workflowError);
      return NextResponse.json({ error: workflowError.message }, { status: 500 });
    }

    if (mappingError) {
      console.error('[admin/workflows] Mapping query failed:', mappingError);
      return NextResponse.json({ error: mappingError.message }, { status: 500 });
    }

    const normalizedMappings = (((mappings ?? []) as unknown as RawWorkflowMappingRecord[]) ?? []).map(
      (mapping): WorkflowMappingRecord => ({
        ...mapping,
        source: Array.isArray(mapping.source)
          ? (mapping.source[0] ?? null)
          : (mapping.source ?? null),
      })
    );

    const groupedMappings = new Map<string, WorkflowMappingRecord[]>();
    for (const mapping of normalizedMappings) {
      const workflowId = mapping.workflow_id;
      const existing = groupedMappings.get(workflowId) ?? [];
      existing.push(mapping);
      groupedMappings.set(workflowId, existing);
    }

    const enriched = ((workflows as WorkflowRecord[] | null) ?? []).map((workflow) => {
      const workflowMappings = groupedMappings.get(workflow.id) ?? [];
      const byRole = workflowMappings.reduce<Record<WorkflowRole, number>>(
        (acc, mapping) => {
          const role = mapping.role;
          acc[role] = (acc[role] ?? 0) + 1;
          return acc;
        },
        {
          detect: 0,
          verify: 0,
          localize: 0,
          benchmark: 0,
        }
      );

      return {
        ...workflow,
        mappings: workflowMappings,
        mapping_summary: {
          detect: byRole.detect,
          verify: byRole.verify,
          localize: byRole.localize,
          benchmark: byRole.benchmark,
          total: workflowMappings.length,
        },
      };
    });

    return NextResponse.json({ workflows: enriched });
  } catch (error) {
    console.error('[admin/workflows] GET exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database credentials are not configured.' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      workflow_id?: string;
      updates?: {
        workflow_name?: string;
        objective?: string;
        output_contract?: string;
        article_tag?: string | null;
        is_active?: boolean;
      };
      mappings?: WorkflowSourceMappingInput[];
    };

    if (!body.workflow_id) {
      return NextResponse.json({ error: 'workflow_id is required.' }, { status: 400 });
    }

    if (body.updates && Object.keys(body.updates).length > 0) {
      const { error: updateError } = await supabase
        .from('content_workflows')
        .update(body.updates)
        .eq('id', body.workflow_id);

      if (updateError) {
        console.error('[admin/workflows] Update workflow failed:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    if (body.mappings) {
      const { error: deleteError } = await supabase
        .from('workflow_source_mappings')
        .delete()
        .eq('workflow_id', body.workflow_id);

      if (deleteError) {
        console.error('[admin/workflows] Delete mappings failed:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      if (body.mappings.length > 0) {
        const payload = body.mappings.map((mapping) => ({
          workflow_id: body.workflow_id,
          source_id: mapping.source_id,
          role: mapping.role,
          priority: mapping.priority,
          is_required: mapping.is_required,
        }));

        const { error: insertError } = await supabase
          .from('workflow_source_mappings')
          .insert(payload);

        if (insertError) {
          console.error('[admin/workflows] Insert mappings failed:', insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/workflows] PUT exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database credentials are not configured.' },
      { status: 503 }
    );
  }

  try {
    const { workflow_id } = (await request.json()) as { workflow_id?: string };

    if (!workflow_id) {
      return NextResponse.json({ error: 'workflow_id is required.' }, { status: 400 });
    }

    // Delete mappings first (foreign key)
    const { error: mappingError } = await supabase
      .from('workflow_source_mappings')
      .delete()
      .eq('workflow_id', workflow_id);

    if (mappingError) {
      console.error('[admin/workflows] Delete mappings failed:', mappingError);
      return NextResponse.json({ error: mappingError.message }, { status: 500 });
    }

    // Delete the workflow
    const { error: workflowError } = await supabase
      .from('content_workflows')
      .delete()
      .eq('id', workflow_id);

    if (workflowError) {
      console.error('[admin/workflows] Delete workflow failed:', workflowError);
      return NextResponse.json({ error: workflowError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/workflows] DELETE exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
