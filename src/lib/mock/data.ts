export type AccountKind = "checking" | "savings" | "credit" | "investment";

export type Account = {
  id: string;
  name: string;
  bank: string;
  kind: AccountKind;
  balance: number;
  color: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description: string;
  category: Category;
};

export type Category =
  | "moradia"
  | "alimentacao"
  | "transporte"
  | "saude"
  | "lazer"
  | "educacao"
  | "servicos"
  | "investimentos"
  | "transferencias"
  | "receita_fixa"
  | "receita_variavel"
  | "impostos"
  | "dizimo"
  | "outros";

export type AssetClass = "rf" | "rv" | "fii" | "cripto" | "cash";

export type InvestmentPosition = {
  id: string;
  ticker: string;
  assetClass: AssetClass;
  currentValue: number;
  costBasis: number;
};

export type GoalStatus = "on_track" | "behind" | "completed";

export type Goal = {
  id: string;
  name: string;
  type: "emergency" | "trip" | "house" | "vehicle" | "retirement" | "education" | "custom";
  target: number;
  current: number;
  deadline: string;
  status: GoalStatus;
};

export const accounts: Account[] = [
  {
    id: "acc_1",
    name: "Itaú Corrente",
    bank: "Itaú",
    kind: "checking",
    balance: 8420.55,
    color: "chart-1",
  },
  {
    id: "acc_2",
    name: "Nubank Cartão",
    bank: "Nubank",
    kind: "credit",
    balance: -3210.4,
    color: "chart-2",
  },
  {
    id: "acc_3",
    name: "Inter PJ",
    bank: "Inter",
    kind: "checking",
    balance: 12340.0,
    color: "chart-3",
  },
  {
    id: "acc_4",
    name: "Caixa FGTS",
    bank: "Caixa",
    kind: "savings",
    balance: 18750.2,
    color: "chart-4",
  },
  {
    id: "acc_5",
    name: "Rico Tesouro",
    bank: "Rico",
    kind: "investment",
    balance: 45200.0,
    color: "chart-1",
  },
  {
    id: "acc_6",
    name: "BTG FII",
    bank: "BTG",
    kind: "investment",
    balance: 28100.5,
    color: "chart-2",
  },
  {
    id: "acc_7",
    name: "Binance Cripto",
    bank: "Binance",
    kind: "investment",
    balance: 7890.3,
    color: "chart-5",
  },
];

export const positions: InvestmentPosition[] = [
  {
    id: "pos_1",
    ticker: "TESOURO IPCA+ 2035",
    assetClass: "rf",
    currentValue: 32400,
    costBasis: 28000,
  },
  { id: "pos_2", ticker: "TESOURO SELIC", assetClass: "rf", currentValue: 12800, costBasis: 12000 },
  { id: "pos_3", ticker: "ITSA4", assetClass: "rv", currentValue: 8400, costBasis: 7200 },
  { id: "pos_4", ticker: "BBAS3", assetClass: "rv", currentValue: 6200, costBasis: 5800 },
  { id: "pos_5", ticker: "MXRF11", assetClass: "fii", currentValue: 15600, costBasis: 14800 },
  { id: "pos_6", ticker: "HGLG11", assetClass: "fii", currentValue: 12500, costBasis: 11800 },
  { id: "pos_7", ticker: "BTC", assetClass: "cripto", currentValue: 5840, costBasis: 4200 },
  { id: "pos_8", ticker: "ETH", assetClass: "cripto", currentValue: 2050, costBasis: 1800 },
];

function generateTransactions(): Transaction[] {
  const txs: Transaction[] = [];
  const today = new Date("2026-04-25T00:00:00Z");

  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - monthOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");

    txs.push({
      id: `tx_salario_${year}_${month}`,
      accountId: "acc_1",
      date: `${year}-${month}-05`,
      amount: 14000,
      description: "Salário",
      category: "receita_fixa",
    });

    txs.push({
      id: `tx_freela_${year}_${month}`,
      accountId: "acc_3",
      date: `${year}-${month}-20`,
      amount: 3000,
      description: "Freela contrato XYZ",
      category: "receita_variavel",
    });

    txs.push({
      id: `tx_aluguel_${year}_${month}`,
      accountId: "acc_1",
      date: `${year}-${month}-10`,
      amount: -3200,
      description: "Aluguel apto",
      category: "moradia",
    });

    for (let i = 0; i < 4; i++) {
      txs.push({
        id: `tx_mercado_${year}_${month}_${i}`,
        accountId: "acc_2",
        date: `${year}-${month}-${String(7 + i * 6).padStart(2, "0")}`,
        amount: -(220 + ((i * 47 + Number(month)) % 90)),
        description: "Mercado Pão de Açúcar",
        category: "alimentacao",
      });
    }

    const deliveryAmount = Number(month) % 3 === 0 ? 720 : 380;
    txs.push({
      id: `tx_delivery_${year}_${month}`,
      accountId: "acc_2",
      date: `${year}-${month}-15`,
      amount: -deliveryAmount,
      description: "iFood + restaurantes",
      category: "alimentacao",
    });

    txs.push({
      id: `tx_uber_${year}_${month}`,
      accountId: "acc_2",
      date: `${year}-${month}-12`,
      amount: -(180 + ((Number(month) * 13) % 80)),
      description: "Uber + 99",
      category: "transporte",
    });

    txs.push({
      id: `tx_streaming_${year}_${month}`,
      accountId: "acc_2",
      date: `${year}-${month}-08`,
      amount: -84.8,
      description: "Spotify + Netflix",
      category: "servicos",
    });

    txs.push({
      id: `tx_aporte_${year}_${month}`,
      accountId: "acc_5",
      date: `${year}-${month}-22`,
      amount: -1500,
      description: "Aporte Tesouro",
      category: "investimentos",
    });

    txs.push({
      id: `tx_saude_${year}_${month}`,
      accountId: "acc_1",
      date: `${year}-${month}-03`,
      amount: -680,
      description: "Plano de saúde",
      category: "saude",
    });
  }

  return txs;
}

export const transactions: Transaction[] = generateTransactions();

export function netWorthByMonth(): Array<{ date: string; netWorth: number }> {
  const today = new Date("2026-04-25T00:00:00Z");
  const series: Array<{ date: string; netWorth: number }> = [];
  let nw = 95000;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const drift = i === 6 ? -0.018 : 0.025 + (i % 3) * 0.005;
    nw = nw * (1 + drift);
    series.push({ date: `${year}-${month}-01`, netWorth: Math.round(nw) });
  }
  return series;
}

export const goals: Goal[] = [
  {
    id: "goal_1",
    name: "Reserva de emergência",
    type: "emergency",
    target: 60000,
    current: 42000,
    deadline: "2026-12-31",
    status: "on_track",
  },
  {
    id: "goal_2",
    name: "Viagem Europa",
    type: "trip",
    target: 18000,
    current: 6800,
    deadline: "2026-09-15",
    status: "behind",
  },
  {
    id: "goal_3",
    name: "Entrada apartamento",
    type: "house",
    target: 120000,
    current: 38500,
    deadline: "2028-12-31",
    status: "on_track",
  },
];
