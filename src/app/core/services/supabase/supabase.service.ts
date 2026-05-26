import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public client: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    const supabaseUrl = 'https://jsxobmzvqeruyxbtbbml.supabase.co';
    const supabaseKey = 'sb_publishable_BcxuFDGCJZI9qNzp8fnbzQ_Su1ugvIq';
    
    this.client = createClient(supabaseUrl, supabaseKey);

    // Initial session load
    this.client.auth.getSession().then(({ data: { session } }) => {
      this.currentUserSubject.next(session?.user ?? null);
    });

    // Listen to auth changes
    this.client.auth.onAuthStateChange((_event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  get auth() {
    return this.client.auth;
  }
}
