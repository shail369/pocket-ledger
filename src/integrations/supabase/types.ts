export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.15" }
  public: {
    Tables: {
      accounts: {
        Row: { color: string; created_at: string; currency: string; icon: string; id: string; is_active: boolean; name: string; opening_balance: number; type: string; user_id: string }
        Insert: { color?: string; created_at?: string; currency?: string; icon?: string; id?: string; is_active?: boolean; name: string; opening_balance?: number; type?: string; user_id: string }
        Update: { color?: string; created_at?: string; currency?: string; icon?: string; id?: string; is_active?: boolean; name?: string; opening_balance?: number; type?: string; user_id?: string }
        Relationships: []
      }
      budgets: {
        Row: { account_id: string | null; amount: number; category_id: string | null; created_at: string; end_date: string | null; id: string; period: string; start_date: string; user_id: string }
        Insert: { account_id?: string | null; amount: number; category_id?: string | null; created_at?: string; end_date?: string | null; id?: string; period?: string; start_date?: string; user_id: string }
        Update: { account_id?: string | null; amount?: number; category_id?: string | null; created_at?: string; end_date?: string | null; id?: string; period?: string; start_date?: string; user_id?: string }
        Relationships: []
      }
      categories: {
        Row: { created_at: string; icon: string; id: string; kind: string; name: string; parent_id: string | null; user_id: string }
        Insert: { created_at?: string; icon?: string; id?: string; kind?: string; name: string; parent_id?: string | null; user_id: string }
        Update: { created_at?: string; icon?: string; id?: string; kind?: string; name?: string; parent_id?: string | null; user_id?: string }
        Relationships: []
      }
      profiles: {
        Row: { created_at: string; currency: string; default_account_id: string | null; email: string | null; id: string; name: string | null }
        Insert: { created_at?: string; currency?: string; default_account_id?: string | null; email?: string | null; id?: string; name?: string | null }
        Update: { created_at?: string; currency?: string; default_account_id?: string | null; email?: string | null; id?: string; name?: string | null }
        Relationships: []
      }
      recurring_transactions: {
        Row: { account_id: string; amount: number; category_id: string | null; created_at: string; description: string; end_date: string | null; frequency: string; id: string; is_active: boolean; next_occurrence: string; start_date: string; type: string; user_id: string }
        Insert: { account_id: string; amount: number; category_id?: string | null; created_at?: string; description?: string; end_date?: string | null; frequency: string; id?: string; is_active?: boolean; next_occurrence?: string; start_date: string; type: string; user_id: string }
        Update: { account_id?: string; amount?: number; category_id?: string | null; created_at?: string; description?: string; end_date?: string | null; frequency?: string; id?: string; is_active?: boolean; next_occurrence?: string; start_date?: string; type?: string; user_id?: string }
        Relationships: []
      }
      transactions: {
        Row: { account_id: string; amount: number; category_id: string | null; created_at: string; date: string; description: string; id: string; transfer_account_id: string | null; type: string; user_id: string }
        Insert: { account_id: string; amount: number; category_id?: string | null; created_at?: string; date?: string; description?: string; id?: string; transfer_account_id?: string | null; type: string; user_id: string }
        Update: { account_id?: string; amount?: number; category_id?: string | null; created_at?: string; date?: string; description?: string; id?: string; transfer_account_id?: string | null; type?: string; user_id?: string }
        Relationships: []
      }
      savings_goals: {
        Row: { id: string; user_id: string; account_id: string; name: string; description: string; icon: string; goal_type: string; priority: string; target_amount: number; target_date: string | null; status: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; account_id: string; name: string; description?: string; icon?: string; goal_type?: string; priority?: string; target_amount: number; target_date?: string | null; status?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; account_id?: string; name?: string; description?: string; icon?: string; goal_type?: string; priority?: string; target_amount?: number; target_date?: string | null; status?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      savings_goal_contributions: {
        Row: { id: string; user_id: string; goal_id: string; amount: number; date: string; note: string; created_at: string }
        Insert: { id?: string; user_id: string; goal_id: string; amount: number; date?: string; note?: string; created_at?: string }
        Update: { id?: string; user_id?: string; goal_id?: string; amount?: number; date?: string; note?: string; created_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      seed_demo_data: { Args: never; Returns: undefined }
      savings_goal_actual_balance: { Args: { p_account_id: string }; Returns: number }
      add_savings_goal_contribution: { Args: { p_goal_id: string; p_amount: number; p_date?: string; p_note?: string }; Returns: { id: string; user_id: string; goal_id: string; amount: number; date: string; note: string; created_at: string } }
      update_savings_goal_contribution: { Args: { p_contribution_id: string; p_amount: number; p_date: string; p_note: string }; Returns: { id: string; user_id: string; goal_id: string; amount: number; date: string; note: string; created_at: string } }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never : never
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never : never
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never : never
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals }, EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals }, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never

export const Constants = { public: { Enums: {} } } as const
