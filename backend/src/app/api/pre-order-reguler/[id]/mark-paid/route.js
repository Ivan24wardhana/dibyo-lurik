// =====================================================
// /api/pre-order-reguler/[id]/mark-paid
// POST - tandai PO sudah lunas (status_pembayaran: dp → lunas)
// Role: kepala_produksi/owner
//
// Side effect: total_dp di-update jadi total_harga (sudah lunas full)
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
    tableName: 'pre_order_reguler',
    id,
  })

  if (!result.success) {
    if (result.error === 'PO tidak ditemukan') {
      return notFoundResponse(result.error)
    }
    return errorResponse(result.error, 400)
  }

  return successResponse(result.data, 'Pembayaran berhasil dilunasi')
})