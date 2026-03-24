export type CartProduct = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
};

export type CheckoutData = {
  products: CartProduct[];
  totalAmount: string;
};

export type ProductApiModel = {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: {
    usertype: {
      usertype: string;
    };
    category: string;
  };
};
