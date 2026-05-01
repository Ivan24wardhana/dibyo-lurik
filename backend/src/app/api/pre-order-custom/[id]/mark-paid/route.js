// =====================================================
// /api/pre-order-custom/[id]/mark-paid
// POST - dp → lunas (auto-update total_dp = total_harga)
// =====================================================

import { withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRE_ORDER_UPDATE_ROLES } from '@/lib/role-helper'
import { isValidUUID } from '@/lib/validation'
import { markPOPaid } from '@/lib/preorder-helper'

export const POST = withAuthAndRole(PRE_ORDER_UPDATE_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const result = await markPOPaid({
    tableName: 'pre_order_custom',
    id,
  })

  if (!result.success) {
    if (result.error === 'PO tidak ditemukan') return notFoundResponse(result.error)
    return errorResponse(result.error, 400)
  }

  return successResponse(result.data, 'Pembayaran berhasil dilunasi')
})