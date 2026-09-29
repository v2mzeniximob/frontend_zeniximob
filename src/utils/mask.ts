// 00.000.000/0000-00
export const maskCnpj = (value?: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '') // Remove tudo que não for número
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,4})/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1'); // Limita o tamanho
};

// 000.000.000-00
export const maskCpf = (value?: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// 00000-000
export const maskCep = (value?: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

// (00) 00000-0000
export const maskPhone = (value?: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2');
};

// Converte String ("R$ 1.000,00") para Float (1000.00) pro Banco
export const parseCurrency = (value?: string) => {
  if (!value) return 0;
  const cleanStr = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(cleanStr);
};