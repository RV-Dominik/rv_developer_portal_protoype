import { supabaseAdmin, Project, Asset, ProjectWithAssets } from '../supabase/client';

export class DatabaseQueries {
  // Project operations
  static async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getProjectById(id: string, ownerId?: string) {
    let query = supabaseAdmin
      .from('projects')
      .select(`
        *,
        assets (*)
      `)
      .eq('id', id);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data as ProjectWithAssets;
  }

  static async getProjectBySlug(slug: string) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        assets (*)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as ProjectWithAssets;
  }

  static async getUserProjects(ownerId: string) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        assets (*)
      `)
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as ProjectWithAssets[];
  }

  static async updateProject(id: string, updates: Partial<Project>, ownerId?: string) {
    let query = supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;
    return data;
  }

  static async deleteProject(id: string, ownerId?: string) {
    let query = supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { error } = await query;

    if (error) throw error;
    return true;
  }

  // Asset operations
  static async createAsset(asset: Omit<Asset, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert(asset)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getProjectAssets(projectId: string) {
    const { data, error } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Asset[];
  }

  static async deleteAsset(id: string, projectId: string) {
    const { error } = await supabaseAdmin
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);

    if (error) throw error;
    return true;
  }

  static async deleteProjectAssets(projectId: string) {
    const { error } = await supabaseAdmin
      .from('assets')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
    return true;
  }
}
