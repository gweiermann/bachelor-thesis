from .collector import Collector
from clang import cindex

class CompareOperationWatcher(Collector):
    def setup(self, frame):
        index = cindex.Index.create()
        tu = index.parse(self.user_cpp_filename, args=['-std=c++17'])
        self.compare_operations = CompareOperationWatcher.extract_compare_operations(tu.cursor)
        self.previous = None
    
    def actual_step(self, frame):
        line_entry = frame.GetLineEntry()
        line = line_entry.GetLine()
        for op in self.compare_operations:
            if op['range']['start']['line'] <= line <= op['range']['end']['line']:
                return {
                    'operation': op,
                }
        return None
    
    def step(self, frame):
        now = self.previous
        self.previous = self.actual_step(frame)
        return now

    def is_reason_for_new_step(self):
        return True
    
    def extract_compare_operations(node):
        results = []
        if node.kind == cindex.CursorKind.BINARY_OPERATOR:
            bin_ops = { '<', '>', '<=', '>=', '==', '!=' }
            token_strs = [t.spelling for t in node.get_tokens()]

            for i, tok in enumerate(token_strs):
                if tok in bin_ops:
                    lhs = ' '.join(token_strs[:i])
                    rhs = ' '.join(token_strs[i+1:])
                    op = tok

                    # extract range
                    extent = node.extent
                    start = extent.start
                    end = extent.end

                    results.append({
                        'lhs': lhs,
                        'op': op,
                        'rhs': rhs,
                        'range': {
                            'start': {
                                'line': start.line,
                                'col': start.column,
                            },
                            'end': {
                                'line': end.line,
                                'col': end.column,
                            }
                        }
                    })
                
        for child in node.get_children():
            results.extend(CompareOperationWatcher.extract_compare_operations(child))

        return results
    