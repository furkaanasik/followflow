export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          theme_mode: 'dark' | 'light' | 'vibrant' | 'vibrant-dark';
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          theme_mode?: 'dark' | 'light' | 'vibrant' | 'vibrant-dark';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          theme_mode?: 'dark' | 'light' | 'vibrant' | 'vibrant-dark';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      income_sources: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';
          pay_day: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';
          pay_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['income_sources']['Insert']
        >;
        Relationships: [];
      };
      recurring_payments: {
        Row: {
          id: string;
          user_id: string;
          icon: string;
          name: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';
          next_payment_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          icon: string;
          name: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';
          next_payment_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['recurring_payments']['Insert']
        >;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          icon: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          icon: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['goals']['Insert']>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          icon: string;
          category_name: string;
          limit_amount: number;
          period_month: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          icon: string;
          category_name: string;
          limit_amount: number;
          period_month: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>;
        Relationships: [];
      };
      goal_contributions: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          amount: number;
          note: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id: string;
          amount: number;
          note?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['goal_contributions']['Insert']
        >;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'income' | 'expense';
          category: string;
          icon: string;
          title: string;
          note: string | null;
          amount: number;
          occurred_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'income' | 'expense';
          category: string;
          icon: string;
          title: string;
          note?: string | null;
          amount: number;
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      add_goal_contribution: {
        Args: {
          p_goal_id: string;
          p_amount: number;
          p_note?: string | null;
          p_occurred_at?: string;
        };
        Returns: Database['public']['Tables']['goals']['Row'];
      };
      remove_goal_contribution: {
        Args: {
          p_contribution_id: string;
        };
        Returns: Database['public']['Tables']['goals']['Row'];
      };
    };
  };
}
