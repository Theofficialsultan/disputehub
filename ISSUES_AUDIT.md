# DisputeHub Issues Audit
**Date:** 2026-02-10

## 🔴 CRITICAL ISSUES

### Mobile App
1. **Evidence not displaying** - Fixed API response mismatch (needs rebuild v18)
2. **Document format issues** - Documents have placeholder brackets like `[YOUR NAME]` instead of actual user data
3. **Missing documents** - Some document types not being generated based on case type

### Admin Dashboard
1. ✅ **Sidebar can't scroll** - FIXED (added overflow-y-auto)
2. ✅ **App Store analytics missing** - FIXED (created /dashboard/app-analytics page)

### Web App
1. **Document generation blocked** - Was requiring summary confirmation (auto-confirm added)

---

## 🟡 MEDIUM ISSUES

### Mobile App
1. **Evidence upload** - Only allows 1 file at a time (should allow batch)
2. **Document download** - Need to verify PDF downloads work correctly
3. **Push notifications** - May not be configured for TestFlight

### Admin Dashboard  
1. **App Store API not connected** - Page shows setup instructions, needs real API integration
2. **Some pages may have stale data** - Need to verify all dashboard pages work

### Web App
1. **9 TODO comments** in codebase - need to address
2. **Document templates** - Have placeholder text that should be filled from user profile

---

## 🟢 MINOR ISSUES / ENHANCEMENTS

### Mobile App
1. Multi-file evidence upload
2. Better error messages
3. Offline support
4. Pull-to-refresh on all screens

### Admin Dashboard
1. Real-time updates via WebSocket
2. Export functionality for reports
3. User impersonation for debugging

### Web App
1. Better loading states
2. More detailed error messages
3. Session timeout handling

---

## DOCUMENT GENERATION FIXES NEEDED

The document templates in `/src/lib/ai/form-templates-*.ts` have these issues:

1. **Placeholders not replaced:**
   - `[YOUR NAME]` should use `user.firstName + user.lastName`
   - `[YOUR ADDRESS]` should use `user.addressLine1`
   - `[YOUR POSTCODE]` should use `user.postcode`
   - `[YOUR EMAIL]` should use `user.email`
   - `[YOUR PHONE]` should use `user.phone`

2. **Missing context:**
   - Templates need user profile data passed in
   - Templates need case-specific data (opponent name, amounts, dates)

3. **Document types needed:**
   - Formal complaint letter
   - Letter Before Action (LBA)
   - County Court N1 form
   - Witness statement
   - Evidence schedule

---

## NEXT STEPS

1. [ ] Rebuild mobile app with evidence fix (v18)
2. [ ] Fix document template placeholder replacement
3. [ ] Add user profile data to document generation context
4. [ ] Test all document types generate correctly
5. [ ] Connect App Store Connect API to admin dashboard
6. [ ] Full QA pass on all three apps
