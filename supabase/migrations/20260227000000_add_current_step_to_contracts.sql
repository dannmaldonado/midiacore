-- Story 4.3: Adicionar current_step na tabela contracts
-- Permite rastrear a etapa de renovação diretamente no contrato

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS current_step TEXT;
