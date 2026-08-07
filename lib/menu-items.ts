export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  featured?: boolean;
};

export const categories = [
  { name: "Sundaes", slug: "sundaes", image: "/images/sundae.jpg" },
  { name: "Cake Cans", slug: "cake-cans", image: "/images/cake-can.jpg" },
  { name: "Cheesecakes", slug: "cheesecakes", image: "/images/cheesecake.jpg" },
  { name: "Milkshakes", slug: "milkshakes", image: "/images/milkshake.jpg" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Death By Chocolate",
    category: "Sundaes",
    description: "A decadent sundae layered with rich chocolate, brownie chunks, and chocolate sauce.",
    price: 179,
    image: "/images/death-by-chocolate.jpg",
    featured: true,
  },
  {
    id: "2",
    name: "Gudbud",
    category: "Sundaes",
    description: "Classic multi-flavour sundae topped with nuts, jelly, and chocolate syrup. A nostalgic treat for all ages.",
    price: 199,
    image: "/images/gudbud.jpg",
    featured: true,
  },
  {
    id: "3",
    name: "Tiramisu Sundae",
    category: "Sundaes",
    description: "A fusion of Italian tiramisu and chocolate fudge sundae, layered with coffee-soaked sponge.",
    price: 199,
    image: "/images/tiramisu-sundae.jpg",
    featured: true,
  },
  {
    id: "9",
    name: "Choco Fudge",
    category: "Sundaes",
    description: "Warm chocolate fudge sundae loaded with rich fudge sauce and chocolate shavings.",
    price: 179,
    image: "/images/choco-fudge.jpg",
    featured: true,
  },
  {
    id: "4",
    name: "Chocolate Truffle Cake Can",
    category: "Cake Cans",
    description: "Rich chocolate truffle cake, layered in a signature CAZERTS can.",
    price: 149,
    image: "/images/cake-can-chocolate.jpg",
  },
  {
    id: "5",
    name: "Belegium Truffle Cake Can",
    category: "Cake Cans",
    description: "Velvety red cake with cream cheese frosting in a can.",
    price: 149,
    image: "/images/cake-can-redvelvet.jpg",
  },
  {
    id: "6",
    name: "Cookie and Creame Cake Can",
    category: "Cake Cans",
    description: "Chocolate cake loaded with crushed Oreo and cream.",
    price: 149,
    image: "/images/cake-can-oreo.jpg",
  },
  {
    id: "7",
    name: "Chocolate Mousse Cake Can",
    category: "Cake Cans",
    description: "Deep Belgian chocolate cake with a molten center.",
    price: 149,
    image: "/images/cake-can-belgian.jpg",
  },
  {
    id: "8",
    name: "Tiramisu Cake Can",
    category: "Cake Cans",
    description: "Coffee-soaked layers with mascarpone cream.",
    price: 149,
    image: "/images/cake-can-tiramisu.jpg",
  },
  {
    id: "10",
    name: "Lotus Biscoff Cheesecake",
    category: "Cheesecakes",
    description: "Creamy cheesecake infused with Lotus Biscoff and topped with crushed biscuits.",
    price: 149,
    image: "/images/cheesecake-biscoff.jpg",
  },
  {
    id: "11",
    name: "Blueberry Cheesecake",
    category: "Cheesecakes",
    description: "Rich and creamy cheesecake topped with a luscious blueberry compote.",
    price: 149,
    image: "/images/cheesecake-blueberry.jpg",
  },
  {
    id: "13",
    name: "Strawberry Cheesecake",
    category: "Cheesecakes",
    description: "Classic creamy cheesecake topped with fresh strawberry compote.",
    price: 149,
    image: "/images/cheesecake-strawberry.jpg",
  },
];