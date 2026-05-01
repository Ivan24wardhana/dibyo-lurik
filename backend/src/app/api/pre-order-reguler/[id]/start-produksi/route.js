// =====================================================
// /api/pre-order-reguler/[id]/start-produksi
// POST - tandai PO mulai produksi (belum_diproses → sedang_diproses)
// Role: kepala_produksi/owner
// =====================================================

import { withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRE_ORDER_UPDATE_ROLES } from '@/lib/role-helper'
import { isValidUUID } from '@/lib/validation'
import { updatePOStatus } from '@/lib/preorder-helper'

export const POST = withAuthAndRole(PRE_ORDER_UPDATE_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const result = await updatePOStatus({
    tableName: 'pre_order_reguler',
    id,
    targetStatus: 'sedang_diproses',
  })

  if (!result.success) {
    if (result.error === 'PO tidak ditemukan') {
      return notFoundResponse(result.error)
    }
    return errorResponse(result.error, 400)
  }

  return successResponse(result.data, 'Pre-order mulai diproses')
})