export function flattenCategories(tree, depth = 0, out = []) {
  for (const node of tree || []) {
    out.push({ code: node.code, name: node.name, depth });
    if (node.children?.length) flattenCategories(node.children, depth + 1, out);
  }
  return out;
}
