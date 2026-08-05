import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: courseData, error } = await supabase
      .from("maincourses")
      .select("title, products(title)")
      .eq("id", "60a5061e-ae81-434d-af75-d706de1f1751")
      .maybeSingle();
      
  console.log("Error:", error);
  console.log("courseData:", courseData);
}

main();
