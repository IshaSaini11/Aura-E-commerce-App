import { wixClientServer } from "@/lib/wixClientServer";
import { products } from "@wix/stores";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Pagination from "./Pagination";

const PRODUCT_PER_PAGE = 8;

const ProductList = async ({
  categoryId,
  limit,
  searchParams,
}: {
  categoryId: string;
  limit?: number;
  searchParams?: any;
}) => {
  try {
    const wixClient = await wixClientServer();

    // Ensure categoryId is provided
    if (!categoryId) {
      throw new Error("categoryId is required");
    }

    const productQuery = wixClient.products.queryProducts();

    // Add conditions to the query
    if (searchParams?.name) {
      productQuery.startsWith("name", searchParams.name);
    }

    productQuery.eq("collectionIds", categoryId);

    if (searchParams?.type) {
      productQuery.hasSome("productType", [searchParams.type]);
    } else {
      productQuery.hasSome("productType", ["physical", "digital"]);
    }

    if (searchParams?.min !== undefined) {
      productQuery.gt("priceData.price", searchParams.min);
    }

    if (searchParams?.max !== undefined) {
      productQuery.lt("priceData.price", searchParams.max);
    }

    if (limit !== undefined) {
      productQuery.limit(limit);
    } else {
      productQuery.limit(PRODUCT_PER_PAGE);
    }

    if (searchParams?.page !== undefined) {
      productQuery.skip(parseInt(searchParams.page) * (limit || PRODUCT_PER_PAGE));
    }

    if (searchParams?.sort) {
      const [sortType, sortBy] = searchParams.sort.split(" ");
      if (sortType === "asc") {
        productQuery.ascending(sortBy);
      } else if (sortType === "desc") {
        productQuery.descending(sortBy);
      }
    }

    const res = await productQuery.find();

    return (
      <div className="mt-12 flex gap-x-8 gap-y-16 justify-between flex-wrap">
        {res.items.map((product: products.Product) => (
          <Link
            href={"/" + product.slug}
            className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
            key={product._id}
          >
            <div className="relative w-full h-80">
              <Image
                src={product.media?.mainMedia?.image?.url || "/product.png"}
                alt=""
                fill
                sizes="25vw"
                className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
              />
              {product.media?.items && (
                <Image
                  src={product.media?.items[1]?.image?.url || "/product.png"}
                  alt=""
                  fill
                  sizes="25vw"
                  className="absolute object-cover rounded-md"
                />
              )}
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{product.name}</span>
              <span className="font-semibold">${product.price?.price}</span>
            </div>
            {product.additionalInfoSections && (
              <div
                className="text-sm text-gray-500"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    product.additionalInfoSections.find(
                      (section: any) => section.title === "shortDesc"
                    )?.description || ""
                  ),
                }}
              ></div>
            )}
            <button className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
              Add to Cart
            </button>
          </Link>
        ))}
        {searchParams?.cat || searchParams?.name ? (
          <Pagination
            currentPage={res.currentPage || 0}
            hasPrev={res.hasPrev()}
            hasNext={res.hasNext()}
          />
        ) : null}
      </div>
    );
  } catch (error) {
    console.error("Error fetching products:", error.message, error.details);
    return (
      <div className="mt-12">
        <p>Something went wrong while fetching products. Please try again later.</p>
      </div>
    );
  }
};

export default ProductList;