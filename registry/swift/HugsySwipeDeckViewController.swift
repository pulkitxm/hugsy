#if canImport(UIKit)
  import Observation
  import SwiftUI
  import UIKit

  @MainActor @Observable final class HugsySwipeDeckModel<Item: Identifiable> {
    var items: [Item]

    init(items: [Item]) {
      self.items = items
    }
  }

  private struct HugsySwipeDeckHost<Item: Identifiable>: View {
    @Bindable var model: HugsySwipeDeckModel<Item>
    let visibleCount: Int
    let leftLabel: String
    let rightLabel: String
    let card: (Item) -> UIView
    let onSwipe: @MainActor (Item, HugsySwipeDirection) -> Void

    var body: some View {
      HugsySwipeDeck(
        items: $model.items, visibleCount: visibleCount, leftLabel: leftLabel,
        rightLabel: rightLabel, onSwipe: onSwipe
      ) { item, _ in
        HugsyUIViewBox(card(item))
      }
    }
  }

  public final class HugsySwipeDeckViewController<Item: Identifiable>: UIViewController {
    public var didSwipe: ((Item, HugsySwipeDirection) -> Void)?
    public var items: [Item] {
      get { model.items }
      set { model.items = newValue }
    }
    private let model: HugsySwipeDeckModel<Item>
    private let visibleCount: Int
    private let leftLabel: String
    private let rightLabel: String
    private let cardView: (Item) -> UIView
    private let cache = HugsyUIViewCache()

    public init(
      items: [Item], visibleCount: Int = 3, leftLabel: String = "Skip",
      rightLabel: String = "Like", cardView: @escaping (Item) -> UIView
    ) {
      self.model = HugsySwipeDeckModel(items: items)
      self.visibleCount = visibleCount
      self.leftLabel = leftLabel
      self.rightLabel = rightLabel
      self.cardView = cardView
      super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    public override func viewDidLoad() {
      super.viewDidLoad()
      view.backgroundColor = .clear
      hugsyEmbed(
        HugsySwipeDeckHost(
          model: model, visibleCount: visibleCount, leftLabel: leftLabel, rightLabel: rightLabel,
          card: { [unowned self] item in
            cache.view(for: AnyHashable(item.id)) { cardView(item) }
          },
          onSwipe: { [unowned self] item, direction in
            cache.retain(Set(model.items.map { AnyHashable($0.id) }))
            didSwipe?(item, direction)
          }))
    }
  }
#endif
