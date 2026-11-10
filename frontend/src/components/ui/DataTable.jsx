import { Table } from "./table";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";

export default function DataTable({
    children,
    className = "",
    data,
    columns,
    getRowId,
    ...props
}) {
    // TanStack Table exposes mutable APIs that React Compiler must not memoize.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: data || [],
        columns: columns || [],
        getCoreRowModel: getCoreRowModel(),
        getRowId,
    });

    return (
        <div className="table-scroll">
            <Table className={`data-table ${className}`.trim()} {...props}>
                {data && columns ? (
                    <>
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length}>No results.</td>
                                </tr>
                            )}
                        </tbody>
                    </>
                ) : (
                    children
                )}
            </Table>
        </div>
    );
}
