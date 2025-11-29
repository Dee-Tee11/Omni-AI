declare module 'pdf-img-convert' {
    export function convert(
        pdf: string | Uint8Array | Buffer,
        options?: {
            width?: number;
            height?: number;
            page_numbers?: number[];
            base64?: boolean;
            scale?: number;
            format?: 'png' | 'jpeg';
        }
    ): Promise<Buffer[] | string[]>;
}
