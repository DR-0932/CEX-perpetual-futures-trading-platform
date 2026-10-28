declare global {
    namespace Express{
        interface Request{
            userId?:string;
            queue:"SPOT" | "PERPS";
        }
    }
}
export{}