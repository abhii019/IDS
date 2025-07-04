import numpy as np

class WhaleOptimizationAlgorithm:
    def __init__(self, n_agents, max_iter, lb, ub, dim, obj_function):
        self.n_agents = n_agents
        self.max_iter = max_iter
        self.lb = lb
        self.ub = ub
        self.dim = dim
        self.obj_function = obj_function
        self.agents = np.random.uniform(lb, ub, (n_agents, dim))
        self.best_agent = None
        self.best_score = float("inf")

    def optimize(self):
        for t in range(self.max_iter):
            for i in range(self.n_agents):
                fitness = self.obj_function(self.agents[i])
                if fitness < self.best_score:
                    self.best_score = fitness
                    self.best_agent = self.agents[i].copy()

                a = 2 - t * (2 / self.max_iter)
                r = np.random.uniform(0, 1, self.dim)
                A = 2 * a * r - a
                C = 2 * r
                p = np.random.uniform(0, 1)

                if p < 0.5:
                    if np.linalg.norm(A) < 1:
                        D = abs(C * self.best_agent - self.agents[i])
                        self.agents[i] = self.best_agent - A * D
                    else:
                        rand_agent = self.agents[np.random.randint(0, self.n_agents)]
                        D = abs(C * rand_agent - self.agents[i])
                        self.agents[i] = rand_agent - A * D
                else:
                    D = abs(self.best_agent - self.agents[i])
                    self.agents[i] = D * np.exp(-1 * (t / self.max_iter)) * np.cos(2 * np.pi * t) + self.best_agent

                self.agents[i] = np.clip(self.agents[i], self.lb, self.ub)

        binary_best_agent = (self.best_agent > 0.5).astype(int)
        return binary_best_agent, self.best_score
