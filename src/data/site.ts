import type { ImageMetadata } from 'astro';

import logoSherwin from '../assets/marcas/sherwin-williams.png';
import logoSuvinil from '../assets/marcas/suvinil.png';
import logoSayerlack from '../assets/marcas/sayerlack.png';
import logoCadillac from '../assets/marcas/cadillac.png';

import imgLeque from '../assets/loja/leque-de-cores.webp';
import imgPolideck from '../assets/produtos/polideck.webp';
import imgSpray from '../assets/loja/spray.webp';
import imgPrateleira2 from '../assets/loja/prateleira-2.webp';
import imgKit from '../assets/produtos/kit-polimento.webp';
import imgTexturas from '../assets/loja/texturas.webp';

import prodMetalatex from '../assets/produtos/metalatex.webp';
import prodRende from '../assets/produtos/rende-cobre.webp';
import prodNovacor from '../assets/produtos/novacor-piso.webp';
import prodPolideck from '../assets/produtos/polideck.webp';
import prodCopal from '../assets/produtos/verniz-copal.webp';
import prodKit from '../assets/produtos/kit-polimento.webp';

const WHATSAPP_NUMBER = '557599861499';

export function whatsappLink(message = 'Olá, venho do Site, gostaria de realizar um orçamento!') {
  return `https://api.whatsapp.com/send/?phone=+${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
}

export const company = {
  name: 'Guanabara Tintas',
  tagline: 'Revenda Master Sherwin-Williams e Suvinil',
  years: 24,
  address: {
    street: 'R. Jaime Guimarães, nº 154',
    district: 'São Félix',
    city: 'Valença - BA',
    zip: '45400-000',
  },
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Guanabara Tintas, R. Jaime Guimarães 154, São Félix, Valença - BA, 45400-000'),
  whatsappDisplay: '(75) 9 9986-1499',
  phone: '(75) 3641-0762',
  phoneHref: 'tel:+557536410762',
  email: 'marketing@guanabaratintas.com.br',
  instagram: 'https://www.instagram.com/guanabaratintas/',
  instagramHandle: '@guanabaratintas',
  cities: ['Valença', 'Morro de São Paulo', 'Barra Grande, Maraú', 'Santo Antônio de Jesus', 'Guaibim'],
};

// day: 0 = domingo … 6 = sábado (same as Date#getDay)
export const hours = [
  { day: 1, label: 'Segunda', open: '08h', close: '18h' },
  { day: 2, label: 'Terça', open: '08h', close: '18h' },
  { day: 3, label: 'Quarta', open: '08h', close: '18h' },
  { day: 4, label: 'Quinta', open: '08h', close: '18h' },
  { day: 5, label: 'Sexta', open: '08h', close: '18h' },
  { day: 6, label: 'Sábado', open: '08h', close: '13h' },
  { day: 0, label: 'Domingo', open: null, close: null },
];

export const perks = [
  { title: 'Parcele em até 10x', note: 'Confira as condições*' },
  { title: 'Frete grátis', note: 'Consulte regiões*' },
  { title: 'Retire na loja', note: 'Grátis' },
  { title: 'Condições exclusivas', note: 'Para pagamento via Pix' },
];

export const differentials = [
  { value: '20+', title: 'Anos de experiência', text: 'Uma loja de tintas que Valença já conhece e confia.' },
  { value: '5 min', title: 'Sua cor na hora', text: 'Tintas personalizadas na máquina de cores.' },
  { value: 'Técnico', title: 'Atendimento especializado', text: 'A gente ajuda a escolher o produto e calcular a quantidade.' },
  { value: 'Rápida', title: 'Entrega e pronta entrega', text: 'Produtos em estoque e entrega rápida na região.' },
];

export type Brand = { name: string; logo?: ImageMetadata };

// Brands without a logo file render as a wordmark until the official logos arrive.
export const brands: Brand[] = [
  { name: 'Sherwin-Williams', logo: logoSherwin },
  { name: 'Suvinil', logo: logoSuvinil },
  { name: 'Sayerlack', logo: logoSayerlack },
  { name: 'Cadillac Auto', logo: logoCadillac },
  { name: 'VONIXX' },
  { name: 'Condor' },
  { name: 'HM Rubber' },
  { name: 'Textura & Cia' },
  { name: 'Axalta' },
];

export type Category = {
  slug: string;
  name: string;
  short: string;
  description: string;
  color: string;
  ink: string;
  image: ImageMetadata;
  products: string[];
  brands: string[];
};

export const categories: Category[] = [
  {
    slug: 'parede',
    name: 'Parede',
    short: 'Interiores, fachadas e acabamentos decorativos.',
    description:
      'Tudo para renovar e proteger paredes internas e externas: tintas imobiliárias, massas, texturas e efeitos decorativos, com a sua cor feita na hora na máquina de cores.',
    color: '#f6c512',
    ink: '#121e58',
    image: imgLeque,
    products: [
      'Tintas Imobiliárias',
      'Tintas Personalizadas com Máquina de Cores',
      'Massa Corrida e Massa Acrílica',
      'Textura de Pedras Naturais',
      'Cimento Queimado',
      'Tintas Protetoras e Impermeabilizantes',
    ],
    brands: ['Sherwin-Williams', 'Suvinil', 'Textura & Cia'],
  },
  {
    slug: 'madeira',
    name: 'Madeira',
    short: 'Vernizes e esmaltes que protegem e realçam.',
    description:
      'Proteção e acabamento para portas, móveis, decks e madeiras externas, preservando os veios e aumentando a durabilidade.',
    color: '#c8742f',
    ink: '#fffdf9',
    image: imgPolideck,
    products: ['Verniz para Madeira', 'Tintas Esmalte Sintético', 'Tintas Spray'],
    brands: ['Sayerlack', 'Sherwin-Williams', 'Suvinil'],
  },
  {
    slug: 'metal',
    name: 'Metal',
    short: 'Portões, grades e estruturas metálicas.',
    description:
      'Esmaltes, epóxis e sprays para proteger e dar acabamento a portões, grades, esquadrias e estruturas metálicas.',
    color: '#5b6b8c',
    ink: '#fffdf9',
    image: imgSpray,
    products: ['Tintas Esmalte Sintético', 'Tintas Epóxi', 'Tintas Spray', 'Tintas Protetoras e Impermeabilizantes'],
    brands: ['Sherwin-Williams', 'Suvinil'],
  },
  {
    slug: 'industria',
    name: 'Indústria',
    short: 'Revestimentos de alto desempenho.',
    description:
      'Linhas industriais e navais para ambientes de alta exigência, com orientação técnica para escolher o sistema de pintura certo.',
    color: '#121e58',
    ink: '#fffdf9',
    image: imgPrateleira2,
    products: ['Tintas Industriais', 'Tintas Epóxi', 'Tintas Navais', 'Borracha Líquida'],
    brands: ['Sherwin-Williams', 'Axalta', 'HM Rubber'],
  },
  {
    slug: 'automotiva',
    name: 'Automotiva',
    short: 'Repintura e estética automotiva.',
    description:
      'Tintas automotivas e produtos de estética para repintura, polimento e cuidado com o carro, do corte ao lustro.',
    color: '#ec008c',
    ink: '#fffdf9',
    image: imgKit,
    products: ['Tintas Automotivas', 'Produtos para Estética Automotiva', 'Tintas Spray'],
    brands: ['Axalta', 'Cadillac Auto', 'VONIXX'],
  },
  {
    slug: 'outras-superficies',
    name: 'Outras superfícies',
    short: 'Pisos, lajes, barcos e muito mais.',
    description:
      'Soluções para superfícies especiais: impermeabilização, borracha líquida, pintura naval, cimento queimado e todos os acessórios para pintar.',
    color: '#ff7e19',
    ink: '#121e58',
    image: imgTexturas,
    products: [
      'Tintas Protetoras e Impermeabilizantes',
      'Borracha Líquida',
      'Tintas Navais',
      'Cimento Queimado',
      'Acessórios para Pintura',
    ],
    brands: ['HM Rubber', 'Condor', 'Textura & Cia'],
  },
];

export const products = [
  { brand: 'Sherwin-Williams', name: 'Metalatex Super Lavável Fosco', text: 'Super cobertura, lavável e sem cheiro para interior e exterior.', image: prodMetalatex },
  { brand: 'Suvinil', name: 'Rende & Cobre Muito', text: 'Acabamento fosco que disfarça imperfeições e rende mais.', image: prodRende },
  { brand: 'Sherwin-Williams', name: 'NovaCor Piso Premium', text: 'Para garagens, calçadas, quadras e pisos comerciais.', image: prodNovacor },
  { brand: 'Sayerlack', name: 'Verniz Premium Polideck', text: 'Proteção solar, resistência a mofo e acabamento que preserva os veios.', image: prodPolideck },
  { brand: 'Sayerlack', name: 'Verniz Copal Alto Brilho', text: 'Alto rendimento para móveis e madeiras decorativas.', image: prodCopal },
  { brand: 'Cadillac', name: 'Kit Polimento Risco Zero', text: 'Ação 3 em 1 para corte, refino e lustro com acabamento de showroom.', image: prodKit },
];
