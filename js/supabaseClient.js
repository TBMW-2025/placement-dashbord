// js/supabaseClient.js

// Replace this with your actual Supabase Anon Key from Settings -> API
const SUPABASE_KEY = 'sb_publishable_7gJM4lgSUGKMeVdrJ_25cA_r1mUW4l9';
const SUPABASE_URL = 'https://zidwpnxhmypmknmchbnt.supabase.co';

if (!window.supabase) {
    console.error("Supabase script not loaded. Ensure it's imported in your HTML.");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper function to handle async calls safely
const apiCall = async (promise) => {
    try {
        const { data, error } = await promise;
        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error("Supabase API Error:", err);
        return { data: null, error: err };
    }
};

window.apiService = {
    supabase,
    
    // Auth Let methods
    async login(email, password) {
        return apiCall(supabase.auth.signInWithPassword({ email, password }));
    },
    
    async logout() {
        return apiCall(supabase.auth.signOut());
    },
    
    async getSession() {
        return apiCall(supabase.auth.getSession());
    },

    // Generic CRUD
    async fetchAll(table) {
        return apiCall(supabase.from(table).select('*').order('created_at', { ascending: false }));
    },

    async insert(table, payload) {
        return apiCall(supabase.from(table).insert([payload]).select());
    },

    async update(table, id, payload) {
        return apiCall(supabase.from(table).update(payload).eq('id', id).select());
    },

    async delete(table, id) {
        return apiCall(supabase.from(table).delete().eq('id', id));
    },

    // Relational fetches
    async fetchPlacements() {
        return apiCall(supabase.from('placements').select(`
            *,
            students (id, student_name, enrollment_number, programme),
            companies (id, company_name)
        `).order('placement_date', { ascending: false }));
    },

    async fetchInternships() {
        return apiCall(supabase.from('internships').select(`
            *,
            students (id, student_name, enrollment_number),
            companies (id, company_name)
        `).order('created_at', { ascending: false }));
    },
    
    async fetchFieldVisits() {
        return apiCall(supabase.from('field_visits').select(`
            *,
            students (id, student_name, enrollment_number)
        `).order('visit_date', { ascending: false }));
    },

    // Storage methods
    async uploadFile(bucket, filePath, file) {
        return apiCall(supabase.storage.from(bucket).upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        }));
    },

    getPublicUrl(bucket, filePath) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    }
};
