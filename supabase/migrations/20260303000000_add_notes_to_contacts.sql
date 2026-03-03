-- Story 5.1: Adicionar campo observações/notas à tabela contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS notes TEXT NULL;
