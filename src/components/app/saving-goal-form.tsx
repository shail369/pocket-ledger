import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SavingGoalForm() {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    // New goals intentionally start with no prefilled values.
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setDescription("");
    setIcon("");
    setColor("");
  }, []);

  return null;
}
