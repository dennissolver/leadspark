#!/bin/bash

# --- LeadSpark Monorepo Final Import Correction Script ---
#
# This script specifically corrects import paths that are incorrectly
# formatted with a leading slash (e.g., /common/...) to use the
# correct path alias (e.g., @leadspark/common/...).
#
# !! WARNING: This script makes permanent changes. Please back up your code. !!
#
# --- Configuration ---
# Root directory of your monorepo
PROJECT_ROOT=$(pwd)

# Frontend package directories to be updated
LANDING_PAGE_DIR="${PROJECT_ROOT}/packages/frontend/landing-page"
PORTAL_DIR="${PROJECT_ROOT}/packages/frontend/portal"
ADMIN_PORTAL_DIR="${PROJECT_ROOT}/packages/frontend/admin-portal"


# --- Step 1: Correct the Import Paths ---
echo "📝 Step 1: Correcting malformed import paths in frontend packages..."

# Function to safely update a file's content
update_file() {
    local file_path=$1
    local old_pattern=$2
    local new_pattern=$3
    # Use perl -pi -e for in-place replacement as it works on both Linux and macOS
    perl -pi -e "s|${old_pattern}|${new_pattern}|g" "${file_path}"
    echo "   - Corrected import in $(basename "${file_path}")"
}

# Find all files and correct their paths
find "${LANDING_PAGE_DIR}" "${PORTAL_DIR}" "${ADMIN_PORTAL_DIR}" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    # Correct the useSupabase hook import path
    update_file "${file}" "\/common\/src\/utils\/supabase\/useSupabase" "@leadspark/common/src/utils/supabase/useSupabase"

    # Correct the supabaseClient library import path
    update_file "${file}" "\/common\/src\/utils\/supabase\/supabaseClient" "@leadspark/common/src/utils/supabase/supabaseClient"

    # Correct the tenant utility import path
    update_file "${file}" "\/common\/src\/utils\/supabase\/tenant" "@leadspark/common/src/utils/supabase/tenant"
done

echo "✅ All incorrect import paths have been fixed."
echo "---------------------------------------------------"

echo "✨ Migration successful! Your imports now use correct path aliases."
echo "Next steps: Rebuild and run your applications to confirm everything works as expected."
