
import { useEffect } from "react";
import { supabase } from "../util/supabase";

export function useChannel(event, callback) {
  useEffect(() => {
    const channel = supabase
      .channel("task-broadcast",{ config: { broadcast: { self: true } } })
      .on("broadcast", { event: event }, (payload) => {
        console.log(`Broadcast received for ${event}:`, payload.payload);
        if (callback) callback(payload.payload);
      })
      .subscribe((status) => {
        console.log(`Broadcast channel status:`, status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);
  
}