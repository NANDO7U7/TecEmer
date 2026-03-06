'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from './supabase';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        setProfile(data);
    }, []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) fetchProfile(s.user.id);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, s) => {
                setSession(s);
                setUser(s?.user ?? null);
                if (s?.user) {
                    fetchProfile(s.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const refreshProfile = () => {
        if (user) fetchProfile(user.id);
    };

    return { user, session, profile, loading, signOut, refreshProfile };
}
