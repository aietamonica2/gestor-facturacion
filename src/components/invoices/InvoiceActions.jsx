// Botones de acción según el rol actual y el estado de la factura
import { useState } from 'react';
import { useApp, ROLES } from '../../context/AppContext.jsx';
import RescheduleModal from './RescheduleModal.jsx';
import IssueModal from './IssueModal.jsx';
import ReviewReasonModal from './ReviewReasonModal.jsx';
import CollectModal from './CollectModal.jsx';
import SendModal from './SendModal.jsx';
import { canAdminEmit, isBlockedForEmission } from '../../utils/status.js';

export default function InvoiceActions({ invoice, compact = false }) {
  const { currentRole, confirmEmission, reschedule, requireReview, issueInvoice, collectInvoice, sendInvoice } = useApp();
  const [modal, setModal] = useState(null);

  const isLider = currentRole === ROLES.lider;
  const isAdmin = currentRole === ROLES.admin;
  const isDirector = currentRole === ROLES.director;

  const btnClass = compact ? 'btn btn-xs' : 'btn btn-sm';

  return (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>

        {/* Acciones del Lider / Director */}
        {(isLider || isDirector) && invoice.estado === 'pendiente_validacion_lider' && (
          <>
            <button className={`${btnClass} btn-success`} onClick={() => confirmEmission(invoice.id)}>
              Confirmar
            </button>
            <button className={`${btnClass} btn-warning`} onClick={() => setModal('reschedule')}>
              Reprogramar
            </button>
            <button className={`${btnClass} btn-danger`} onClick={() => setModal('review')}>
              Revision
            </button>
          </>
        )}

        {/* Reprogramar desde planificada / reprogramada */}
        {(isLider || isDirector) &&
          ['planificada', 'reprogramada'].includes(invoice.estado) && (
            <button className={`${btnClass} btn-warning`} onClick={() => setModal('reschedule')}>
              Reprogramar
            </button>
          )}

        {/* Acciones del Administrativo */}
        {isAdmin && canAdminEmit(invoice) && (
          <button className={`${btnClass} btn-primary`} onClick={() => setModal('issue')}>
            Emitir
          </button>
        )}

        {isAdmin && invoice.estado === 'emitida' && (
          <button className={`${btnClass} btn-secondary`} onClick={() => setModal('send')}>
            Enviar
          </button>
        )}

        {isAdmin && ['emitida', 'enviada_al_cliente', 'vencida'].includes(invoice.estado) && (
          <button className={`${btnClass} btn-success`} onClick={() => setModal('collect')}>
            Cobrada
          </button>
        )}

        {/* Bloqueado para admin */}
        {isAdmin && isBlockedForEmission(invoice) && !canAdminEmit(invoice) &&
          !['cobrada', 'cancelada', 'emitida', 'enviada_al_cliente'].includes(invoice.estado) && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '4px 8px' }}>
              {invoice.estado === 'reprogramada' ? 'Reprogramada' : 'Requiere revision'}
            </span>
          )}
      </div>

      {/* Modals */}
      {modal === 'reschedule' && (
        <RescheduleModal invoice={invoice} onReschedule={reschedule} onClose={() => setModal(null)} />
      )}
      {modal === 'issue' && (
        <IssueModal invoice={invoice} onIssue={issueInvoice} onClose={() => setModal(null)} />
      )}
      {modal === 'review' && (
        <ReviewReasonModal invoice={invoice} onRequireReview={requireReview} onClose={() => setModal(null)} />
      )}
      {modal === 'collect' && (
        <CollectModal invoice={invoice} onCollect={collectInvoice} onClose={() => setModal(null)} />
      )}
      {modal === 'send' && (
        <SendModal invoice={invoice} onSend={sendInvoice} onClose={() => setModal(null)} />
      )}
    </>
  );
}
